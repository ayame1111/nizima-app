
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  const session = await auth();
  
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                title: true,
                creator: {
                    select: {
                        name: true,
                        email: true
                    }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate Analytics
    const totalRevenue = orders.reduce((sum, order) => sum + (order.status === 'COMPLETED' ? order.amount : 0), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
    
    // Calculate Platform Fees (assuming 15%)
    const platformRevenue = totalRevenue * 0.15;

    return NextResponse.json({
      orders,
      analytics: {
        totalRevenue,
        platformRevenue,
        totalOrders,
        completedOrders
      }
    });
  } catch (error) {
    console.error('Failed to fetch admin orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
