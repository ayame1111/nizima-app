
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                iconUrl: true,
                creator: {
                    select: {
                        name: true,
                        email: true
                    }
                }
              }
            }
          }
        },
        downloadLogs: {
            orderBy: {
                downloadedAt: 'desc'
            }
        }
      }
    });

    if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
