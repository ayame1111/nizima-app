import { prisma } from '@/lib/prisma';
import MarketplaceClient from './MarketplaceClient';
import { auth } from '@/auth';

export const revalidate = 0;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth();
  const params = await searchParams;
  const sort = params.sort as string | undefined;
  
  let favoriteIds: string[] = [];
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { favorites: { select: { id: true } } }
    });
    favoriteIds = user?.favorites.map(f => f.id) || [];
  }

  let orderBy: any = { createdAt: 'desc' };

  if (sort === 'popular') {
     orderBy = { favoritedBy: { _count: 'desc' } };
  } else if (sort === 'oldest') {
     orderBy = { createdAt: 'asc' };
  } else if (sort === 'price_asc') {
     orderBy = { price: 'asc' };
  } else if (sort === 'price_desc') {
     orderBy = { price: 'desc' };
  }

  const products = await prisma.product.findMany({
    where: {
      status: 'APPROVED',
      isVisible: true,
    },
    orderBy,
    include: {
      creator: true,
    }
  });

  const formattedProducts = products.map(p => ({
    ...p,
    tags: p.tags ? p.tags.split(',') : [],
    mediaUrls: p.mediaUrls ? p.mediaUrls.split(',') : []
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Marketplace</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                Explore thousands of high-quality Live2D models created by talented artists from around the world.
            </p>
        </div>
      </div>
      
      <MarketplaceClient 
        initialProducts={formattedProducts} 
        userId={session?.user?.id}
        favoriteIds={favoriteIds}
      />
    </div>
  );
}