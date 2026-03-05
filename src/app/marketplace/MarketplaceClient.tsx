'use client';

import { useState, useMemo } from 'react';
import ProductCardImage from '@/components/ProductCardImage';
import LikeButton from '@/components/LikeButton';
import Link from 'next/link';
import { ShoppingBag, Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

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
  sex?: string | null;
  eyeColor?: string | null;
  hairColor?: string | null;
  bodyType?: string | null;
  theme?: string | null;
  tags?: string | null;
}

interface MarketplaceClientProps {
  initialProducts: Product[];
  userId?: string;
  favoriteIds: string[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function MarketplaceClient({ initialProducts, userId, favoriteIds }: MarketplaceClientProps) {
  const [sexFilter, setSexFilter] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Specific attribute filters
  const [themeFilter, setThemeFilter] = useState('');
  const [eyeColorFilter, setEyeColorFilter] = useState('');
  const [hairColorFilter, setHairColorFilter] = useState('');
  const [bodyTypeFilter, setBodyTypeFilter] = useState('');

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(product => {
      // Search
      if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !product.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Sex
      if (sexFilter !== 'All') {
          // If product sex is null/undefined, it matches nothing specific, or maybe 'Other'?
          // Let's assume strict match for now.
          if (product.sex !== sexFilter) return false;
      }

      // Price
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false;
      }

      // Attributes (Simple partial match)
      if (themeFilter && !product.theme?.toLowerCase().includes(themeFilter.toLowerCase())) return false;
      if (eyeColorFilter && !product.eyeColor?.toLowerCase().includes(eyeColorFilter.toLowerCase())) return false;
      if (hairColorFilter && !product.hairColor?.toLowerCase().includes(hairColorFilter.toLowerCase())) return false;
      if (bodyTypeFilter && !product.bodyType?.toLowerCase().includes(bodyTypeFilter.toLowerCase())) return false;

      return true;
    });
  }, [initialProducts, searchQuery, sexFilter, priceRange, themeFilter, eyeColorFilter, hairColorFilter, bodyTypeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header / Search Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search models..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-100 border border-transparent focus:bg-white focus:border-purple-500 rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all"
                    />
                </div>
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="md:hidden w-full flex items-center justify-center gap-2 bg-gray-100 px-4 py-2.5 rounded-lg font-medium text-gray-700"
                >
                    <Filter size={20} /> Filters
                </button>
                <div className="hidden md:block text-sm text-gray-500">
                    Showing {filteredProducts.length} results
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className={`md:w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-36 space-y-8">
                    <div className="flex justify-between items-center md:hidden mb-4">
                        <h3 className="font-bold text-lg">Filters</h3>
                        <button onClick={() => setIsFilterOpen(false)}><X size={20} /></button>
                    </div>

                    {/* Sex Filter */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Sex</h3>
                        <div className="space-y-2">
                            {['All', 'Female', 'Male', 'Unisex', 'Other'].map(option => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="sex" 
                                        checked={sexFilter === option}
                                        onChange={() => setSexFilter(option)}
                                        className="text-purple-600 focus:ring-purple-500 border-gray-300"
                                    />
                                    <span className={`text-sm ${sexFilter === option ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Price Range</h3>
                        <div className="space-y-4">
                            <input 
                                type="range" 
                                min="0" 
                                max="5000" 
                                step="10"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>${priceRange[0]}</span>
                                <span>${priceRange[1]}</span>
                            </div>
                        </div>
                    </div>

                    {/* Attributes */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider border-t border-gray-100 pt-4">Attributes</h3>
                        
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Theme</label>
                            <input 
                                type="text" 
                                value={themeFilter}
                                onChange={(e) => setThemeFilter(e.target.value)}
                                placeholder="Any Theme"
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Eye Color</label>
                            <input 
                                type="text" 
                                value={eyeColorFilter}
                                onChange={(e) => setEyeColorFilter(e.target.value)}
                                placeholder="Any Color"
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Hair Color</label>
                            <input 
                                type="text" 
                                value={hairColorFilter}
                                onChange={(e) => setHairColorFilter(e.target.value)}
                                placeholder="Any Color"
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Body Type</label>
                            <input 
                                type="text" 
                                value={bodyTypeFilter}
                                onChange={(e) => setBodyTypeFilter(e.target.value)}
                                placeholder="Any Body Type"
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            setSexFilter('All');
                            setPriceRange([0, 5000]);
                            setThemeFilter('');
                            setEyeColorFilter('');
                            setHairColorFilter('');
                            setBodyTypeFilter('');
                            setSearchQuery('');
                        }}
                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 underline"
                    >
                        Reset Filters
                    </button>
                </div>
            </aside>

            {/* Product Grid */}
            <main className="flex-grow">
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="text-gray-400" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No matches found</h3>
                        <p className="text-gray-500">Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="group bg-white rounded-2xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 border border-gray-100 flex flex-col h-full">
                                <Link href={`/product/${product.slug || product.id}`} className="relative aspect-[4/5] bg-gray-100 overflow-hidden block">
                                    <ProductCardImage 
                                        src={product.iconUrl || ''} 
                                        alt={product.title} 
                                        previewUrl={product.previewUrl} 
                                    />
                                    
                                    <div className="absolute top-3 left-3 z-20 bg-white/90 text-gray-900 text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md uppercase tracking-wide shadow-sm flex items-center gap-1">
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
                                        <h3 className="text-base font-bold text-gray-900 truncate pr-2 group-hover:text-purple-600 transition-colors" title={product.title}>
                                            {product.title}
                                        </h3>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-3">
                                        {product.creator?.image ? (
                                            <img src={product.creator.image} className="w-5 h-5 rounded-full object-cover" alt={product.creator.name || 'Creator'} />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                {(product.creator?.name || 'U').charAt(0)}
                                            </div>
                                        )}
                                        <span className="text-xs text-gray-500 font-medium">{product.creator?.name || 'Unknown Artist'}</span>
                                    </div>
                                    
                                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-lg font-bold text-gray-900">
                                            {formatCurrency(product.price)}
                                        </span>
                                        {product.sex && (
                                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase">{product.sex}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
      </div>
    </div>
  );
}