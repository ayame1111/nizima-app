import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, Search } from "lucide-react";
import MarketplaceClient from "@/app/marketplace/MarketplaceClient";

export const revalidate = 0;

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch user with their favorites
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { 
        favorites: {
            include: { creator: true }
        } 
    }
  });

  const favorites = user?.favorites || [];
  const formattedFavorites = favorites.map(f => ({
    ...f,
    tags: f.tags ? f.tags.split(',') : [],
    mediaUrls: f.mediaUrls ? f.mediaUrls.split(',') : []
  }));
  const favoriteIds = favorites.map(f => f.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-full mb-4">
                <Heart size={32} className="text-pink-500 fill-current" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">My Favorites</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                Your collection of liked models. Keep track of what catches your eye.
            </p>
        </div>
      </div>
      
      {favorites.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No favorites yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">
                      Start exploring the marketplace and heart the models you love to see them here.
                  </p>
                  <Link href="/marketplace" className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg shadow-gray-900/10 dark:shadow-white/10">
                      <Search size={18} />
                      Explore Marketplace
                  </Link>
              </div>
          </div>
      ) : (
          <MarketplaceClient 
            initialProducts={formattedFavorites} 
            userId={session.user.id}
            favoriteIds={favoriteIds}
          />
      )}
    </div>
  );
}
