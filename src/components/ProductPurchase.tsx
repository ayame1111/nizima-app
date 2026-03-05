'use client';

import { useState } from 'react';
import PayPalButton from './PayPalButton';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Check } from 'lucide-react';

interface ProductPurchaseProps {
  product: {
    id: string;
    title: string;
    price: number;
    isSold: boolean;
    iconUrl?: string | null;
    creatorName?: string;
  };
}

export default function ProductPurchase({ product }: ProductPurchaseProps) {
  const [purchased, setPurchased] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const { addToCart, isInCart } = useCart();

  const inCart = isInCart(product.id);

  if (product.isSold) {
    return (
      <button disabled className="w-full bg-gray-300 text-gray-500 font-bold py-3 px-4 rounded cursor-not-allowed">
        This model has been sold
      </button>
    );
  }

  if (purchased) {
    return (
      <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center animate-fade-in">
        <h3 className="text-xl font-bold text-green-800 mb-2">Purchase Successful!</h3>
        <p className="text-green-700 mb-4">Thank you for your purchase.</p>
        <a 
          href={downloadUrl} 
          className="inline-block bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          Download Model
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <button 
            onClick={() => addToCart(product)}
            disabled={inCart}
            className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                inCart 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
        >
            {inCart ? (
                <>
                    <Check size={20} /> Added to Cart
                </>
            ) : (
                <>
                    <ShoppingCart size={20} /> Add to Cart
                </>
            )}
        </button>
        
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">Or Buy Now</span>
            </div>
        </div>

        <PayPalButton 
          amount={product.price} 
          productId={product.id} 
          onSuccess={(data) => {
            console.log('Purchase successful:', data);
            setPurchased(true);
            if (data.downloadUrl) {
                setDownloadUrl(data.downloadUrl);
            }
          }}
        />
    </div>
  );
}
