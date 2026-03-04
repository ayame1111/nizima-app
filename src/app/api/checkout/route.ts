import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { productId, paypalOrderId, payerEmail, transactionId } = await req.json();

    if (!productId || !paypalOrderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Start transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if product exists and is available
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.isSold) {
        throw new Error('Product is already sold');
      }

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          productId,
          buyerEmail: payerEmail || 'unknown@example.com',
          status: 'COMPLETED',
          transactionId: transactionId || paypalOrderId,
        },
      });

      // 3. Mark product as sold
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { isSold: true },
      });

      return { order, product: updatedProduct };
    });

    const downloadLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/download/${result.order.id}`;

    // 4. Send email
    if (payerEmail) {
        await sendEmail({
            to: payerEmail,
            subject: "Your Order Confirmation - Avatar Atelier",
            html: `
                <h1>Thank you for your purchase!</h1>
                <p>You have successfully purchased: <strong>${result.product.title}</strong></p>
                <p>You can download your files here:</p>
                <a href="${downloadLink}">${downloadLink}</a>
                <br>
                <p>Transaction ID: ${transactionId || paypalOrderId}</p>
            `,
        });
    }

    return NextResponse.json({ 
      success: true, 
      orderId: result.order.id,
      downloadUrl: downloadLink 
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ 
      error: error.message || 'Checkout failed' 
    }, { status: 500 });
  }
}
