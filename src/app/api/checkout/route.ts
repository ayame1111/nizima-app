import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      await tx.product.update({
        where: { id: productId },
        data: { isSold: true },
      });

      return { order };
    });

    return NextResponse.json({ 
      success: true, 
      orderId: result.order.id,
      downloadUrl: `/api/download/${result.order.id}` 
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ 
      error: error.message || 'Checkout failed' 
    }, { status: 500 });
  }
}
