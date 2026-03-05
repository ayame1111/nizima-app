import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const session = await auth();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Security: Only allow completed orders to be downloaded
    if (order.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Order is not completed' }, { status: 403 });
    }

    // Authorization: If the order is linked to a user, they MUST be logged in as that user.
    // If not linked (guest), allow download via secret UUID (status quo) 
    // OR if logged in, ensure email matches.
    if (order.userId) {
      if (!session || session.user?.id !== order.userId) {
        return NextResponse.json({ error: 'Unauthorized: You do not own this order' }, { status: 403 });
      }
    } else if (session) {
      // Guest order but user is logged in - check if email matches
      if (session.user?.email && session.user.email.toLowerCase() !== order.buyerEmail.toLowerCase()) {
        return NextResponse.json({ error: 'Unauthorized: This order belongs to another email address' }, { status: 403 });
      }
    }

    // Check if the file exists
    const filePath = order.product.fileUrl;
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on server' }, { status: 500 });
    }

    // Read file into buffer (for MVP simplicity)
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `${order.product.title.replace(/[^a-z0-9]/gi, '_')}.zip`;

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
