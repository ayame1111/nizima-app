
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';
import JSZip from 'jszip';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const userAgent = req.headers.get('user-agent') || 'unknown';
  // Simple IP extraction
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

  let orderId = '';
  let userId: string | undefined = undefined;

  try {
    const resolvedParams = await params;
    orderId = resolvedParams.orderId;
    const session = await auth();
    userId = session?.user?.id;

    // Find order by ID or Payment ID (Stripe Session ID)
    let order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: {
            include: { product: true }
        }
      },
    });

    if (!order) {
        // Try finding by paymentId (Stripe Session ID)
        order = await prisma.order.findFirst({
            where: { paymentId: orderId },
            include: { 
                items: {
                    include: { product: true }
                }
            },
        });
    }

    if (!order) {
      await logDownload(orderId, userId, null, ip, userAgent, 'FAILED', 'Order not found');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Security: Only allow completed orders to be downloaded
    if (order.status !== 'COMPLETED') {
      await logDownload(orderId, userId, null, ip, userAgent, 'FAILED', 'Order not completed');
      return NextResponse.json({ error: 'Order is not completed' }, { status: 403 });
    }

    // Authorization
    if (order.userId) {
      if (!session || session.user?.id !== order.userId) {
        await logDownload(orderId, userId, null, ip, userAgent, 'FAILED', 'Unauthorized owner');
        return NextResponse.json({ error: 'Unauthorized: You do not own this order' }, { status: 403 });
      }
    } else {
        // Guest order: We rely on the fact that they have the unique session ID (the link is secret)
        // OR we can check cookies/local storage if we implemented guest tracking.
        // For now, if there's no userId on the order, we allow the download IF the user reached here via the correct link.
        // But wait, the route is /api/download/[sessionId]. Wait, the param is named orderId but we are passing session.id from success page.
        
        // Actually, the success page passes session.id. We need to look up the order by paymentId (which stores session.id).
    }

    // Handle Multiple Files
    if (order.items.length === 0) {
        return NextResponse.json({ error: 'No items in order' }, { status: 500 });
    }

    // If single item, serve directly
    if (order.items.length === 1) {
        const product = order.items[0].product;
        const filePath = product.fileUrl;
        
        if (!fs.existsSync(filePath)) {
            await logDownload(orderId, userId, product.id, ip, userAgent, 'FAILED', 'File missing');
            return NextResponse.json({ error: 'File not found on server' }, { status: 500 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = `${product.title.replace(/[^a-z0-9]/gi, '_')}.zip`;

        await logDownload(orderId, userId, product.id, ip, userAgent, 'SUCCESS');

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } 
    
    // If multiple items, bundle them into one ZIP
    const zip = new JSZip();
    let hasFiles = false;

    for (const item of order.items) {
        if (fs.existsSync(item.product.fileUrl)) {
            const fileData = fs.readFileSync(item.product.fileUrl);
            const safeName = `${item.product.title.replace(/[^a-z0-9]/gi, '_')}.zip`;
            zip.file(safeName, fileData);
            hasFiles = true;
            await logDownload(orderId, userId, item.product.id, ip, userAgent, 'SUCCESS', 'Bundled download');
        } else {
            console.error(`File missing for product ${item.product.id}`);
            await logDownload(orderId, userId, item.product.id, ip, userAgent, 'FAILED', 'File missing in bundle');
        }
    }

    if (!hasFiles) {
        return NextResponse.json({ error: 'No valid files found to download' }, { status: 500 });
    }

    const content = await zip.generateAsync({ type: 'nodebuffer' });
    const bundleName = `order_${order.paymentId || order.id}.zip`;

    return new NextResponse(content as any, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${bundleName}"`,
            'Content-Length': content.length.toString(),
        },
    });

  } catch (error) {
    console.error('Download error:', error);
    await logDownload(orderId, userId, null, ip, userAgent, 'FAILED', 'Server error');
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}

async function logDownload(
    orderId: string, 
    userId: string | undefined | null, 
    productId: string | null, 
    ip: string, 
    userAgent: string, 
    status: string, 
    reason?: string
) {
    try {
        if (!orderId) return;
        await prisma.downloadLog.create({
            data: {
                orderId,
                userId: userId || undefined,
                productId: productId || undefined,
                ip,
                userAgent,
                status,
                reason
            }
        });
    } catch (e) {
        console.error('Failed to log download:', e);
    }
}
