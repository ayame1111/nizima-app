
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch products created by this user
    const products = await prisma.product.findMany({
      where: { creatorId: userId },
      include: {
        orderItems: {
            include: {
                order: true
            }
        }
      }
    });

    // 2. Calculate Analytics
    let totalRevenue = 0;
    let totalSales = 0;
    const salesByProduct: any[] = [];

    products.forEach(product => {
        // Count only completed orders
        const completedSales = product.orderItems.filter(item => item.order.status === 'COMPLETED');
        const revenue = completedSales.reduce((sum, item) => sum + item.price, 0);
        
        // Net Revenue (minus 15% platform fee)
        const netRevenue = revenue * 0.85;

        totalSales += completedSales.length;
        totalRevenue += netRevenue;

        if (completedSales.length > 0) {
            salesByProduct.push({
                id: product.id,
                title: product.title,
                sales: completedSales.length,
                revenue: netRevenue,
                iconUrl: product.iconUrl
            });
        }
    });

    // Sort top products
    salesByProduct.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      totalRevenue,
      totalSales,
      productsCount: products.length,
      topProducts: salesByProduct.slice(0, 5) // Top 5
    });

  } catch (error) {
    console.error('Failed to fetch creator analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
