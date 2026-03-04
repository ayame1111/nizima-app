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

    if (error || !src) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 absolute inset-0 z-10 pointer-events-none">
                {previewUrl ? (
                    <LazyLive2DViewer modelUrl={previewUrl} interactive={false} />
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