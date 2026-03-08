
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === 'checkout.session.completed') {
    // Fulfill the order
    const productId = session.metadata?.productId;
    const userId = session.metadata?.userId;

    if (!productId) {
      return new NextResponse('Missing productId in metadata', { status: 400 });
    }

    try {
        // 1. Create the Order
        const order = await prisma.order.create({
            data: {
                paymentId: session.id, // Store Stripe Session ID
                amount: session.amount_total ? session.amount_total / 100 : 0,
                status: 'COMPLETED',
                buyerEmail: session.customer_details?.email || undefined,
                userId: userId && userId !== 'guest' ? userId : undefined,
                purchaseIp: 'webhook', // We don't have IP here
                refundWaived: session.metadata?.refundWaived === 'true',
                items: {
                    create: {
                        productId: productId,
                        price: session.amount_total ? session.amount_total / 100 : 0
                    }
                }
            }
        });

        // 2. Mark product as sold
        await prisma.product.update({
            where: { id: productId },
            data: { isSold: true }
        });

        console.log(`Order ${order.id} created for product ${productId}`);

    } catch (error) {
        console.error('Error fulfilling order:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
