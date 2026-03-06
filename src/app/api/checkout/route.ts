import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { auth } from '@/auth';
import { getIp } from '@/lib/ip';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const ip = await getIp();
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const { productId, productIds, paypalOrderId, payerEmail, transactionId, amount } = await req.json();

    const itemsToProcess = productIds || (productId ? [productId] : []);

    if (itemsToProcess.length === 0 || !paypalOrderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Start transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate Products & Calculate Total
      const products = [];
      let totalAmount = 0;

      for (const pId of itemsToProcess) {
          const product = await tx.product.findUnique({
            where: { id: pId },
          });

          if (!product) {
            throw new Error(`Product ${pId} not found`);
          }

          if (product.isSold) {
            throw new Error(`Product ${product.title} is already sold`);
          }
          
          products.push(product);
          totalAmount += product.price;
      }

      // 2. Create Single Order with multiple Items
      const order = await tx.order.create({
        data: {
          paymentId: paypalOrderId,
          status: 'COMPLETED',
          amount: amount ? parseFloat(amount) : totalAmount, // Use provided amount or calculated
          buyerEmail: payerEmail || 'unknown@example.com',
          userId: userId,
          purchaseIp: ip,
          userAgent: userAgent,
          items: {
            create: products.map(p => ({
                productId: p.id,
                price: p.price
            }))
          }
        },
      });

      // 3. Mark products as sold
      for (const product of products) {
          await tx.product.update({
            where: { id: product.id },
            data: { isSold: true },
          });
      }

      return { order, products };
    });

    // Generate download link (single link for the order)
    const downloadLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/download/${result.order.id}`;

    // 4. Send email (summary)
    if (payerEmail) {
        const productListHtml = result.products.map(p => `
            <li>
                <strong>${p.title}</strong>
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
                <p><strong>Total Paid: $${result.order.amount}</strong></p>
                <br>
                <h3>Access Your Files</h3>
                <p>You can download your files using the link below:</p>
                <a href="${downloadLink}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Download Files</a>
                <br><br>
                <p><small>Transaction ID: ${transactionId || paypalOrderId}</small></p>
                <p><small>IP Address logged for security: ${ip}</small></p>
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
