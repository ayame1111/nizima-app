import { prisma } from '@/lib/prisma';
import MarketplaceClient from './MarketplaceClient';
import { auth } from '@/auth';

export const revalidate = 0;

export default async function MarketplacePage() {
  const session = await auth();
  
  let favoriteIds: string[] = [];
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { favorites: { select: { id: true } } }
    });
    favoriteIds = user?.favorites.map(f => f.id) || [];
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      creator: true,
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Marketplace</h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                Explore thousands of high-quality Live2D models created by talented artists from around the world.
            </p>
        </div>
      </div>
      
      <MarketplaceClient 
        initialProducts={products} 
        userId={session?.user?.id}
        favoriteIds={favoriteIds}
      />
    </div>
  );
}