'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Trash2, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdminDashboardClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('ADMIN ACTION: Are you sure you want to delete this product? This cannot be undone.')) return;

    try {
      await axios.delete(`/api/admin/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      setMessage('Product deleted successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
        console.error('Delete failed', error);
        alert('Failed to delete product');
    }
  };

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    let adminNote = '';

    if (status === 'REJECTED') {
        const reason = prompt("Please enter the reason for rejection:");
        if (reason === null) return; // Cancelled
        adminNote = reason || 'Violates community guidelines';
    } else {
        if (!confirm(`Are you sure you want to ${status.toLowerCase()} this product?`)) return;
    }

    try {
      const formData = new FormData();
      formData.append('status', status);
      if (adminNote) {
          formData.append('adminNote', adminNote);
      }
      
      await axios.patch(`/api/admin/products/${id}`, formData);
      
      setMessage(`Product ${status.toLowerCase()} successfully.`);
      
      // Update local state
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status, adminNote } : p));
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Update failed', error);
      alert('Failed to update status');
    }
  };

  const filteredProducts = products.filter(p => filter === 'ALL' ? true : p.status === filter);

  return (
    <div className="space-y-6">
        {message && (
            <div className="bg-green-900/20 border border-green-800 text-green-400 p-4 rounded-lg flex items-center gap-2">
                <CheckCircle size={18} /> {message}
            </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 bg-[#111] p-1 rounded-lg border border-gray-800 w-fit">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
                >
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                    <span className="ml-2 text-xs opacity-60 bg-gray-700 px-1.5 py-0.5 rounded-full">
                        {products.filter(p => f === 'ALL' ? true : p.status === f).length}
                    </span>
                </button>
            ))}
        </div>

        <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {filter === 'ALL' ? 'All Products' : `${filter.charAt(0) + filter.slice(1).toLowerCase()} Products`}
                </h2>
                <button onClick={fetchProducts} className="text-sm text-blue-400 hover:text-blue-300">Refresh List</button>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
                    <Clock className="animate-spin" />
                    Loading products...
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No products found in this category.</div>
            ) : (
                <div className="divide-y divide-gray-800">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex gap-4 items-start">
                                <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-700">
                                    {product.iconUrl ? (
                                        <img src={product.iconUrl} alt={product.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-2xl">
                                            {product.title.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white text-lg">{product.title}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                            product.status === 'APPROVED' ? 'bg-green-900/20 text-green-400 border-green-900' :
                                            product.status === 'REJECTED' ? 'bg-red-900/20 text-red-400 border-red-900' :
                                            'bg-yellow-900/20 text-yellow-400 border-yellow-900'
                                        }`}>
                                            {product.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-400 flex flex-col gap-1">
                                        <div className="flex items-center gap-4">
                                            <span>By: <Link href={`/creator/${product.creator?.slug || product.creator?.id}`} className="text-blue-400 hover:underline">{product.creator?.name || 'Unknown'}</Link></span>
                                            <span>Price: <span className="text-green-400">${product.price}</span></span>
                                        </div>
                                        <span className="text-xs text-gray-600 font-mono">ID: {product.id}</span>
                                        {product.adminNote && (
                                            <span className="text-xs text-red-400 mt-1">Note: {product.adminNote}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap justify-end">
                                <Link
                                    href={`/product/${product.slug || product.id}`} 
                                    target="_blank"
                                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700 flex items-center gap-2"
                                >
                                    <ExternalLink size={14} /> View
                                </Link>

                                {product.status === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(product.id, 'APPROVED')}
                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-green-900/20 flex items-center gap-2"
                                        >
                                            <CheckCircle size={14} /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(product.id, 'REJECTED')}
                                            className="px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            <XCircle size={14} /> Reject
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="px-3 py-1.5 bg-transparent hover:bg-red-900/20 text-gray-500 hover:text-red-500 border border-transparent hover:border-red-900/30 rounded-lg text-sm font-medium transition-all ml-2 flex items-center gap-2"
                                    title="Delete Permanently"
                                >
                                    <Trash2 size={14} /> Delete
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
