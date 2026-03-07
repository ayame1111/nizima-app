import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import LazyLive2DViewer from '@/components/LazyLive2DViewer';
import ProductCardImage from '@/components/ProductCardImage';
import LikeButton from '@/components/LikeButton';
import Navbar from '@/components/Navbar';
import { ShoppingBag, Search, Menu, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';
import ProductCarousel from '@/components/ProductCarousel';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const revalidate = 0; // Disable caching for real-time updates

export default async function Home() {
  const session = await auth();
  
  let favoriteIds: string[] = [];
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { favorites: { select: { id: true } } }
    });
    favoriteIds = user?.favorites.map(f => f.id) || [];
  }

  const latestArrivals = await prisma.product.findMany({
    where: { 
        status: 'APPROVED',
        isVisible: true
    },
    take: 12,
    orderBy: { createdAt: 'desc' },
    include: {
      creator: true,
    }
  });

  const mostLiked = await prisma.product.findMany({
    where: { 
      status: 'APPROVED',
      isSold: false,
      isVisible: true
    },
    take: 12,
    orderBy: {
      favoritedBy: {
        _count: 'desc'
      }
    },
    include: {
      creator: true,
    }
  });
  
  const isCreatorOrAdmin = session?.user && ['CREATOR', 'ADMIN'].includes((session.user as any).role);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-50 dark:bg-gray-950 pt-16 pb-20 lg:pt-24 lg:pb-28 transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30 pointer-events-none">
            <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[80%] rounded-full bg-purple-200 dark:bg-purple-900 blur-[120px]" />
            <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-200 dark:bg-blue-900 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            New Models Added Weekly
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
                    Find Your Perfect <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Avatar</span>
                </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover high-quality, ready-to-use Live2D models from talented artists. Start your VTubing journey today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/marketplace" className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg shadow-gray-900/20 dark:shadow-white/10 hover:shadow-gray-900/40 hover:-translate-y-0.5 flex items-center justify-center gap-2">
              Explore Marketplace <ArrowRight size={18} />
            </Link>
            {!isCreatorOrAdmin && (
                <Link href="/become-creator" className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:border-gray-300 dark:hover:border-gray-600">
                Become a Creator
                </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured Grid (Carousel) - Latest Arrivals */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Latest Arrivals</h2>
              <p className="text-gray-500 dark:text-gray-400">Freshly rigged models ready for debut.</p>
            </div>
            <Link href="/marketplace?sort=newest" className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 group">
              View all <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <ProductCarousel products={latestArrivals} favoriteIds={favoriteIds} />
          
        </div>
      </section>

      {/* Featured Grid (Carousel) - Most Liked */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Most Liked</h2>
              <p className="text-gray-500 dark:text-gray-400">Popular models loved by the community.</p>
            </div>
            <Link href="/marketplace?sort=popular" className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 group">
              View all <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <ProductCarousel products={mostLiked} favoriteIds={favoriteIds} />
          
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">Avatar Atelier</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        The premier marketplace for high-quality Live2D models. empowering VTubers and creators worldwide.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">Marketplace</h4>
                    <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Browse All</Link></li>
                        <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">New Arrivals</Link></li>
                        <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Top Rated</Link></li>
                        <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Free Assets</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">Support</h4>
                    <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Help Center</Link></li>
                        <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Terms of Service</Link></li>
                        <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
                        <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Contact Us</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">Newsletter</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Subscribe to get updates on new drops.</p>
                    <div className="flex gap-2">
                        <input type="email" placeholder="Email address" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-purple-500 text-gray-900 dark:text-white" />
                        <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                <p>&copy; 2024 Avatar Atelier. All rights reserved.</p>
                <div className="flex gap-6">
                    <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Twitter</Link>
                    <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Discord</Link>
                    <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Instagram</Link>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}