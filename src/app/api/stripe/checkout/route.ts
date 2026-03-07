import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Allow guest checkout? For now let's require auth or handle it
    // The prompt says "allows customers to buy a product".
    
    const { productId } = await req.json();

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { creator: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.creator?.stripeAccountId) {
      return NextResponse.json({ error: 'Creator is not setup for payments' }, { status: 400 });
    }

    // Platform fee (15%)
    const priceInCents = Math.round(product.price * 100);
    const applicationFee = Math.round(priceInCents * 0.15);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.title,
              description: product.description || undefined,
              images: product.iconUrl && product.iconUrl.startsWith('http') ? [product.iconUrl] : [],
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: product.creator.stripeAccountId,
        },
      },
      success_url: `${(process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${(process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')}/product/${product.id}`,
      metadata: {
        productId: product.id,
        userId: session?.user?.id || 'guest',
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
