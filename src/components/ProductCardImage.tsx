'use client';

import { useState } from 'react';
import LazyLive2DViewer from './LazyLive2DViewer';

interface ProductCardImageProps {
    src: string;
    alt: string;
    previewUrl: string | null;
}

export default function ProductCardImage({ src, alt, previewUrl }: ProductCardImageProps) {
    const [error, setError] = useState(false);
    const [showLive2D, setShowLive2D] = useState(false);

    if (error || !src) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 absolute inset-0 z-10">
                {previewUrl ? (
                    showLive2D ? (
                        <div className="w-full h-full">
                            <LazyLive2DViewer modelUrl={previewUrl} interactive={false} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-gray-400 text-sm font-medium">Preview Unavailable</span>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowLive2D(true);
                                }}
                                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-full shadow-sm hover:bg-gray-50 transition-colors z-20 pointer-events-auto"
                            >
                                Load Live2D
                            </button>
                        </div>
                    )
                ) : (
                    <span className="text-gray-400 text-sm font-medium">No Preview</span>
                )}
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            onError={() => setError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
    );
}