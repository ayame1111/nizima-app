'use client';

import { useCart } from '@/context/CartContext';
import Navbar from '@/components/Navbar'; // Assuming Navbar is used in layout, but maybe we need it here if layout doesn't provide it? 
// Actually layout provides Navbar. We just need content.
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import PayPalButton from '@/components/PayPalButton';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart();
  const { data: session, status } = useSession();
  const [success, setSuccess] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState<string[]>([]);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-6">Thank you for your purchase. Your files are ready for download.</p>
            
            <div className="space-y-3 mb-8">
                {downloadUrls.map((url, i) => (
                    <a key={i} href={url} className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors">
                        Download Item {i + 1}
                    </a>
                ))}
            </div>

            <Link href="/" className="block w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors">
                Continue Shopping
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <ShoppingBag className="text-gray-400" /> Your Cart
        </h1>

        {cart.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={40} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-8">Looks like you haven't added any models yet.</p>
                <Link href="/" className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                    <ArrowLeft size={20} /> Browse Marketplace
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.iconUrl ? (
                                    <img src={item.iconUrl} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                        No IMG
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>
                                <p className="text-sm text-gray-500">{item.creatorName || 'Unknown Artist'}</p>
                                <p className="text-purple-600 font-bold mt-1">${item.price.toFixed(2)}</p>
                            </div>
                            <button 
                                onClick={() => removeFromCart(item.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal ({cart.length} items)</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg text-gray-900">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        {session ? (
                            <PayPalButton 
                                amount={total} 
                                productIds={cart.map(i => i.id)}
                                onSuccess={(data) => {
                                    console.log('Cart Checkout Success:', data);
                                    if (data.downloadUrls) {
                                        setDownloadUrls(data.downloadUrls);
                                    } else if (data.downloadUrl) {
                                        setDownloadUrls([data.downloadUrl]);
                                    }
                                    setSuccess(true);
                                    clearCart();
                                }}
                            />
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <p className="text-sm text-gray-600 mb-3">Please login to complete your purchase.</p>
                                <Link href="/login?callbackUrl=/cart" className="block w-full bg-gray-900 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors">
                                    Login to Checkout
                                </Link>
                            </div>
                        )}
                        
                        <p className="text-xs text-center text-gray-400 mt-4">
                            Secure checkout via PayPal. Instant download after payment.
                        </p>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
