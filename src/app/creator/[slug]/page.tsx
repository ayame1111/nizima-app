import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Twitter, Youtube, Globe, Instagram, Package, User as UserIcon } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Try to find by slug first, then ID for backward compatibility
  const user = await prisma.user.findFirst({
    where: { 
        OR: [
            { slug: slug },
            { id: slug }
        ]
    },
  });

  if (!user) return { title: 'Creator Not Found' };

  return {
    title: `${user.name}'s Portfolio - Nizima App`,
    description: user.bio || `Check out ${user.name}'s models on Nizima App.`,
  };
}

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Try to find by slug first, then ID for backward compatibility
  const user = await prisma.user.findFirst({
    where: { 
        OR: [
            { slug: slug },
            { id: slug }
        ]
    },
  });

  if (!user) {
    notFound();
  }

  // Fetch creator's products
  const products = await prisma.product.findMany({
    where: { 
        creatorId: user.id, // Use the found user's ID
        status: 'APPROVED', // Only show approved products
    },
    orderBy: { createdAt: 'desc' },
    include: { creator: true }
  });

  const socialLinks = (user.socialLinks as any) || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Banner - Updated to 16:9 aspect ratio */}
      <div className="w-full relative bg-gray-200 dark:bg-gray-800 overflow-hidden aspect-video max-h-[500px]">
        {user.bannerUrl ? (
            <img 
                src={user.bannerUrl} 
                alt={`${user.name}'s banner`} 
                className="w-full h-full object-cover"
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                <div className="text-6xl font-black opacity-10 uppercase tracking-widest select-none">
                    Creator Portfolio
                </div>
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-end md:items-start gap-6 mb-8">
            {/* Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-gray-950 bg-white dark:bg-gray-900 overflow-hidden shadow-xl flex-shrink-0">
                {user.image ? (
                    <img src={user.image} alt={user.name || 'Creator'} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
                        <UserIcon size={48} />
                    </div>
                )}
            </div>
            
            {/* Info */}
            <div className="flex-grow pb-2 md:pt-24 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{user.name}</h1>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Creator
                    </span>
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                        <Package size={14} /> {products.length} Models
                    </span>
                </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 pb-4 md:pt-24">
                {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:text-blue-400 hover:shadow-md transition-all text-gray-600 dark:text-gray-300">
                        <Twitter size={20} />
                    </a>
                )}
                {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:text-red-600 hover:shadow-md transition-all text-gray-600 dark:text-gray-300">
                        <Youtube size={20} />
                    </a>
                )}
                {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:text-pink-600 hover:shadow-md transition-all text-gray-600 dark:text-gray-300">
                        <Instagram size={20} />
                    </a>
                )}
                {socialLinks.website && (
                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:text-indigo-600 hover:shadow-md transition-all text-gray-600 dark:text-gray-300">
                        <Globe size={20} />
                    </a>
                )}
            </div>
        </div>

        {/* Bio Section */}
        {user.bio && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-12">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About Me</h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {user.bio}
                </p>
            </div>
        )}

        {/* Products Grid */}
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
                Available Models
            </h2>
            
            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} favoriteIds={[]} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <Package size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No models published yet.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
