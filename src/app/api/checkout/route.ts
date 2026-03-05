import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { productId, productIds, paypalOrderId, payerEmail, transactionId } = await req.json();

    const itemsToProcess = productIds || (productId ? [productId] : []);

    if (itemsToProcess.length === 0 || !paypalOrderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Start transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const orders = [];
      const products = [];

      for (const pId of itemsToProcess) {
          // 1. Check if product exists and is available
          const product = await tx.product.findUnique({
            where: { id: pId },
          });

          if (!product) {
            throw new Error(`Product ${pId} not found`);
          }

          if (product.isSold) {
            throw new Error(`Product ${product.title} is already sold`);
          }

          // 2. Create Order
          const order = await tx.order.create({
            data: {
              productId: pId,
              buyerEmail: payerEmail || 'unknown@example.com',
              status: 'COMPLETED',
              transactionId: transactionId || paypalOrderId,
            },
          });

          // 3. Mark product as sold
          const updatedProduct = await tx.product.update({
            where: { id: pId },
            data: { isSold: true },
          });
          
          orders.push(order);
          products.push(updatedProduct);
      }

      return { orders, products };
    });

    // Generate download links
    const downloadLinks = result.orders.map(order => 
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/download/${order.id}`
    );

    // 4. Send email (summary)
    if (payerEmail) {
        const productListHtml = result.products.map((p, index) => `
            <li>
                <strong>${p.title}</strong> - <a href="${downloadLinks[index]}">Download</a>
            </li>
        `).join('');

        await sendEmail({
            to: payerEmail,
            subject: "Your Order Confirmation - Avatar Atelier",
            html: `
                <h1>Thank you for your purchase!</h1>
                <p>You have successfully purchased the following items:</p>
                <ul>
                    ${productListHtml}
                </ul>
                <br>
                <p>Transaction ID: ${transactionId || paypalOrderId}</p>
            `,
        });
    }

    return NextResponse.json({ 
      success: true, 
      orderIds: result.orders.map(o => o.id),
      downloadUrls: downloadLinks
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ 
      error: error.message || 'Checkout failed' 
    }, { status: 500 });
  }
}
