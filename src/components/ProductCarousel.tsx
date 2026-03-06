'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ProductCardImage from '@/components/ProductCardImage';
import LikeButton from '@/components/LikeButton';
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  iconUrl?: string | null;
  previewUrl: string;
  creator?: {
    name?: string | null;
    image?: string | null;
  } | null;
  isSold?: boolean;
}

interface ProductCarouselProps {
  products: Product[];
  favoriteIds: string[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function ProductCarousel({ products, favoriteIds }: ProductCarouselProps) {
  const [startIndex, setStartIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerPage(2);
      else if (window.innerWidth < 1024) setItemsPerPage(3);
      else if (window.innerWidth < 1280) setItemsPerPage(4);
      else setItemsPerPage(5);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, products.length - itemsPerPage);

  useEffect(() => {
      if (startIndex > maxIndex) setStartIndex(maxIndex);
  }, [itemsPerPage, maxIndex, startIndex]);

  const nextSlide = () => {
    setStartIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setStartIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  // Auto-slide functionality
  useEffect(() => {
    if (isHovered || products.length <= itemsPerPage) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [maxIndex, isHovered, products.length, itemsPerPage]);

  if (products.length === 0) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-gray-50 dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
        <div className="bg-white dark:bg-gray-700 p-6 rounded-full mb-4 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No models available yet</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            The marketplace is currently empty. Check back soon for new exclusive Live2D models from our top creators.
        </p>
        </div>
    );
  }

  // Calculate width percentage based on itemsPerPage
  // Using 100% / itemsPerPage and padding for gaps ensures perfect alignment
  const getItemWidthClass = () => {
      // Tailwind classes for standard fractions
      if (itemsPerPage === 1) return 'w-full';
      if (itemsPerPage === 2) return 'w-1/2';
      if (itemsPerPage === 3) return 'w-1/3';
      if (itemsPerPage === 4) return 'w-1/4';
      if (itemsPerPage === 5) return 'w-1/5';
      if (itemsPerPage === 6) return 'w-1/6';
      // Fallback to inline style if needed, but here just use percentage
      return `w-[${100 / itemsPerPage}%]`;
  };
  
  return (
    <div 
      className="relative group/carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation Buttons */}
      {products.length > itemsPerPage && (
        <>
            <button 
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 p-3 rounded-full shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110 opacity-0 group-hover/carousel:opacity-100"
                aria-label="Previous slide"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 p-3 rounded-full shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110 opacity-0 group-hover/carousel:opacity-100"
                aria-label="Next slide"
            >
                <ChevronRight size={24} />
            </button>
        </>
      )}

      {/* Carousel Track */}
      <div className="overflow-hidden -mx-8 px-4 py-10"> {/* Adjusted negative margin for larger padding */}
        <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${startIndex * (100 / itemsPerPage)}%)` }}
        >
            {products.map((product) => (
              <div 
                key={product.id} 
                className={`flex-shrink-0 px-4 transition-all duration-500 ${getItemWidthClass()}`}
              >
                <div className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)] transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col h-full">
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
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}