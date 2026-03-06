'use client';

import { useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface ProductGalleryProps {
  mediaUrls: string[];
}

export default function ProductGallery({ mediaUrls }: ProductGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!mediaUrls || mediaUrls.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
        const scrollAmount = 300; // Approximate width of one item
        const currentScroll = scrollContainerRef.current.scrollLeft;
        const newScrollLeft = direction === 'left' 
            ? currentScroll - scrollAmount 
            : currentScroll + scrollAmount;
        
        scrollContainerRef.current.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        });
    }
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % mediaUrls.length);
  };

  const prevMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gallery</h2>
      
      {/* Scrollable Carousel Container */}
      <div className="relative group">
          {/* Scroll Buttons */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black p-2 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>
          
          <button 
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black p-2 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          >
            <ChevronRight className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>

          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth"
          >
            {mediaUrls.map((url, index) => (
            <div 
                key={index} 
                className="flex-shrink-0 w-80 md:w-96 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 aspect-video relative group/item cursor-pointer snap-center"
                onClick={() => openLightbox(index)}
            >
                {url.endsWith('.mp4') || url.endsWith('.webm') ? (
                <video 
                    src={url} 
                    className="w-full h-full object-contain pointer-events-none" 
                    preload="metadata"
                />
                ) : (
                <img 
                    src={url} 
                    alt={`Gallery image ${index + 1}`} 
                    className="w-full h-full object-contain transition-transform duration-300 group-hover/item:scale-105"
                />
                )}
                
                {/* Hover Overlay with Icon */}
                <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/item:opacity-100 duration-300">
                    <div className="bg-white/90 dark:bg-black/80 p-3 rounded-full shadow-lg backdrop-blur-sm transform translate-y-4 group-hover/item:translate-y-0 transition-all">
                        <Maximize2 className="text-gray-900 dark:text-white w-6 h-6" />
                    </div>
                </div>
                
                {/* Video Indicator */}
                {(url.endsWith('.mp4') || url.endsWith('.webm')) && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        VIDEO
                    </div>
                )}
            </div>
            ))}
          </div>
          
          {/* Fade gradients for scrolling indication */}
          <div className="absolute top-0 bottom-4 left-0 w-12 bg-gradient-to-r from-white dark:from-gray-950 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute top-0 bottom-4 right-0 w-12 bg-gradient-to-l from-white dark:from-gray-950 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={closeLightbox}
        >
            {/* Close Button */}
            <button 
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all z-[102]"
            >
                <X size={24} />
            </button>

            {/* Navigation Buttons */}
            {mediaUrls.length > 1 && (
                <>
                    <button 
                        onClick={prevMedia}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all z-[102] hidden sm:block"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <button 
                        onClick={nextMedia}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all z-[102] hidden sm:block"
                    >
                        <ChevronRight size={32} />
                    </button>
                </>
            )}

            {/* Main Content Container */}
            <div 
                className="relative max-w-7xl w-full h-full flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
            >
                {mediaUrls[currentIndex].endsWith('.mp4') || mediaUrls[currentIndex].endsWith('.webm') ? (
                    <video 
                        src={mediaUrls[currentIndex]} 
                        controls 
                        autoPlay
                        className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg"
                    />
                ) : (
                    <img 
                        src={mediaUrls[currentIndex]} 
                        alt={`Fullscreen view ${currentIndex + 1}`} 
                        className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg select-none"
                    />
                )}
                
                {/* Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur text-white text-sm px-4 py-1.5 rounded-full border border-white/10">
                    {currentIndex + 1} / {mediaUrls.length}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
