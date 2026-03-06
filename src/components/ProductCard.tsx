'use client';

import Link from 'next/link';
import ProductCardImage from './ProductCardImage';
import LikeButton from './LikeButton';

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    iconUrl?: string | null;
    previewUrl?: string | null;
    creator?: {
      id?: string;
      name?: string | null;
      image?: string | null;
    } | null;
    sex?: string | null;
  };
  favoriteIds: string[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function ProductCard({ product, favoriteIds }: ProductCardProps) {
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)] transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col h-full">
        <Link href={`/product/${product.slug || product.id}`} className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700 overflow-hidden block">
            <ProductCardImage 
                src={product.iconUrl || ''} 
                alt={product.title} 
                previewUrl={product.previewUrl || ''} 
            />
            
            <div className="absolute top-3 left-3 z-20 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md uppercase tracking-wide shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live2D
            </div>

            <LikeButton productId={product.id} initialIsFavorited={favoriteIds.includes(product.id)} />

            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center pb-6 hidden md:flex">
                <span className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-bold text-sm shadow-lg hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all">
                    View Details
                </span>
            </div>
        </Link>
        
        <div className="p-4 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate pr-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" title={product.title}>
                    {product.title}
                </h3>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
                {product.creator?.image ? (
                    <img src={product.creator.image} className="w-5 h-5 rounded-full object-cover" alt={product.creator.name || 'Creator'} />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        {(product.creator?.name || 'U').charAt(0)}
                    </div>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{product.creator?.name || 'Unknown Artist'}</span>
            </div>
            
            <div className="mt-auto pt-3 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(product.price)}
                </span>
                {product.sex && (
                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded uppercase">{product.sex}</span>
                )}
            </div>
        </div>
    </div>
  );
}
