'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function AdminDashboardClient() {
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchPendingProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/products');
      // Filter client-side for now as the API returns all for admin
      const pending = response.data.filter((p: any) => p.status === 'PENDING');
      setPendingProducts(pending);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this product?`)) return;

    try {
      const formData = new FormData();
      formData.append('status', status);
      
      await axios.patch(`/api/admin/products/${id}`, formData);
      
      setMessage(`Product ${status.toLowerCase()} successfully.`);
      // Remove from list
      setPendingProducts(prev => prev.filter(p => p.id !== id));
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Update failed', error);
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
        {message && (
            <div className="bg-green-900/20 border border-green-800 text-green-400 p-4 rounded-lg">
                {message}
            </div>
        )}

        <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Pending Approvals
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">{pendingProducts.length}</span>
                </h2>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading pending requests...</div>
            ) : pendingProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No pending models to review.</div>
            ) : (
                <div className="divide-y divide-gray-800">
                    {pendingProducts.map((product) => (
                        <div key={product.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:bg-white/5 transition-colors">
                            <div className="flex gap-4 items-center">
                                <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                    {product.iconUrl ? (
                                        <img src={product.iconUrl} alt={product.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xl">
                                            {product.title.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{product.title}</h3>
                                    <div className="text-sm text-gray-400 flex flex-col gap-1">
                                        <span>By: <span className="text-blue-400">{product.creator?.name || 'Unknown'}</span></span>
                                        <span>Price: <span className="text-green-400">${product.price}</span></span>
                                        <span className="text-xs text-gray-500">ID: {product.id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <a 
                                    href={`/product/${product.slug || product.id}`} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors border border-gray-700"
                                >
                                    Inspect Model
                                </a>
                                <button
                                    onClick={() => handleStatusUpdate(product.id, 'APPROVED')}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-green-900/20"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(product.id, 'REJECTED')}
                                    className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
