'use client';

import { Heart } from 'lucide-react';

export default function LikeButton() {
  return (
    <button 
        className="absolute top-3 right-3 z-20 p-2 bg-white/90 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Future: Add like logic here
            console.log('Like clicked');
        }}
    >
        <Heart size={16} />
    </button>
  );
}
