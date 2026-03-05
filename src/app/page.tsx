import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import LazyLive2DViewer from '@/components/LazyLive2DViewer';
import ProductCardImage from '@/components/ProductCardImage';
import LikeButton from '@/components/LikeButton';
import Navbar from '@/components/Navbar';
import { ShoppingBag, Search, Menu, ArrowRight } from 'lucide-react';
import { auth } from '@/auth';

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

  const products = await prisma.product.findMany({
    take: 8, // Limit to 8 latest products
    orderBy: { createdAt: 'desc' },
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

      {/* Featured Grid */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Latest Arrivals</h2>
              <p className="text-gray-500 dark:text-gray-400">Freshly rigged models ready for debut.</p>
            </div>
            <Link href="/marketplace" className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 group">
              View all <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)] transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                {/* Image/Preview Area - Wrapped in Link for better mobile UX */}
                <Link href={`/product/${product.slug || product.id}`} className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700 overflow-hidden block">
                    <ProductCardImage 
                        src={product.iconUrl || ''} 
                        alt={product.title} 
                        previewUrl={product.previewUrl} 
                    />
                    
                    {/* Live2D Badge */}
                    <div className="absolute top-3 left-3 z-20 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md uppercase tracking-wide shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live2D
                    </div>

                    {/* Like Button - Prevent link navigation when clicking like */}
                    <LikeButton productId={product.id} initialIsFavorited={favoriteIds.includes(product.id)} />

                    {/* Quick Add Overlay - Visible on desktop hover, hidden on mobile since the whole card is a link */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center pb-6 hidden md:flex">
                        <span
                            className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-bold text-sm shadow-lg hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                        >
                            View Details
                        </span>
                    </div>
                </Link>
                
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" title={product.title}>
                        {product.title}
                      </h3>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    {product.creator?.image ? (
                        <img src={product.creator.image} className="w-5 h-5 rounded-full object-cover" alt={product.creator.name || 'Creator'} />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">
                            {(product.creator?.name || 'U').charAt(0)}
                        </div>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{product.creator?.name || 'Unknown Artist'}</span>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(product.price)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Commercial License</span>
                  </div>
                </div>
              </div>
            ))}
            
            {products.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-gray-50 dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-700 p-6 rounded-full mb-4 shadow-sm">
                  <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No models available yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    The marketplace is currently empty. Check back soon for new exclusive Live2D models from our top creators.
                </p>
              </div>
            )}
          </div>
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