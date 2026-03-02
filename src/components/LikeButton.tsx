'use client';

import { Heart } from 'lucide-react';
import { toggleFavorite } from '@/app/actions/favorites';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LikeButton({ productId, initialIsFavorited }: { productId: string, initialIsFavorited?: boolean }) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited || false);

  return (
    <button 
        className={`absolute top-3 right-3 z-20 p-2 rounded-full transition-all shadow-sm translate-y-2 group-hover:translate-y-0 duration-300 ${isFavorited ? 'bg-white text-red-500 opacity-100' : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100'}`}
        onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Optimistic update
            setIsFavorited(!isFavorited);

            const result = await toggleFavorite(productId);
            if (result.error === "Unauthorized") {
                router.push('/login');
            } else if (result.favorited !== undefined) {
                setIsFavorited(result.favorited);
            }
        }}
    >
        <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
    </button>
  );
}
