'use client';

import { useState } from 'react';
import axios from 'axios';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Check, Loader2, CreditCard } from 'lucide-react';

interface ProductPurchaseProps {
  product: {
    id: string;
    title: string;
    price: number;
    isSold: boolean;
    iconUrl?: string | null;
    slug: string;
    creator?: {
      id: string;
      name: string;
    };
    creatorName?: string;
  };
}

export default function ProductPurchase({ product }: ProductPurchaseProps) {
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const { addToCart, isInCart } = useCart();

  const inCart = isInCart(product.id);

  const [agreed, setAgreed] = useState(false);

  const handleBuyNow = async () => {
    if (!agreed) {
        alert('You must agree to the Terms of Service and Refund Policy before purchasing.');
        return;
    }
    setLoading(true);
    try {
      const response = await axios.post('/api/stripe/checkout', {
        productId: product.id,
      });
      const { url } = response.data;
      if (url) {
        window.location.href = url;
      } else {
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.error || 'Failed to initiate checkout.');
    } finally {
      setLoading(false);
    }
  };

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

        <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
            <input 
                type="checkbox" 
                id="agreement" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="agreement" className="cursor-pointer select-none">
                I agree to the <a href="/terms" className="text-blue-500 hover:underline" target="_blank">Terms of Service</a> and acknowledge that because this is a digital downloadable product, I waive my right to a refund once the download has started.
            </label>
        </div>

        <button 
          onClick={handleBuyNow}
          disabled={loading || !agreed}
          className={`w-full font-bold py-3 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 ${
            !agreed 
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
            : 'bg-[#635BFF] hover:bg-[#5851E1] text-white'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Processing...
            </>
          ) : (
            <>
              <CreditCard size={20} /> Buy with Stripe
            </>
          )}
        </button>
    </div>
  );
}
