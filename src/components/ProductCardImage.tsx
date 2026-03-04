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
            <div className="w-full h-full flex items-center justify-center bg-gray-100 absolute inset-0 z-30">
                {previewUrl ? (
                    showLive2D ? (
                        <div className="w-full h-full relative z-40">
                            <LazyLive2DViewer modelUrl={previewUrl} interactive={false} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 p-4 text-center relative z-50">
                            <span className="text-gray-500 text-sm font-bold">Image Missing</span>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowLive2D(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all cursor-pointer pointer-events-auto border border-blue-500"
                            >
                                Load 3D Preview
                            </button>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400 relative z-50">
                        <span className="text-sm font-medium">No Preview</span>
                    </div>
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