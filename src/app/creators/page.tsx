
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const revalidate = 3600; // Cache for 1 hour

export default async function CreatorsPage() {
  // Fetch creators with their sold product count
  const creators = await prisma.user.findMany({
    where: {
      role: 'CREATOR',
    },
    select: {
      id: true,
      name: true,
      image: true,
      slug: true,
      bio: true,
      _count: {
        select: {
          createdProducts: {
            where: { isSold: true }
          }
        }
      }
    },
    // Prisma doesn't support orderBy on relation aggregates directly in top-level findMany easily in all versions,
    // but let's try fetching and sorting in JS for now since creator count is likely small.
    // If we have thousands, we'd need a raw query or a different schema approach (e.g. salesCount field on User).
  });

  // Sort by sales count descending
  const sortedCreators = creators.sort((a, b) => b._count.createdProducts - a._count.createdProducts);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Top Creators</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                Meet the talented artists behind the best Live2D models on Avatar Atelier.
            </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedCreators.map((creator, index) => (
                <Link href={`/creator/${creator.slug || creator.id}`} key={creator.id} className="group">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm">
                                    {creator.image ? (
                                        <img src={creator.image} alt={creator.name || 'Creator'} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
                                            {(creator.name || '?')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {index < 3 && (
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-900">
                                        #{index + 1}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {creator.name || 'Unknown Artist'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {creator._count.createdProducts} Sales
                                </p>
                            </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-6 flex-grow">
                            {creator.bio || "No bio available."}
                        </p>

                        <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-bold mt-auto">
                            View Profile <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>
            ))}
        </div>
        
        {sortedCreators.length === 0 && (
            <div className="text-center py-12 text-gray-500">
                No creators found yet. Be the first!
            </div>
        )}
      </div>
    </div>
  );
}
