'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('Dashboard: User is unauthenticated. Redirecting to login...');
      // router.push('/login'); // Commented out for debugging
    } else if (status === 'authenticated') {
        // @ts-ignore
        const role = session.user.role;
        console.log('Current user role:', role);
        if (role !== 'CREATOR' && role !== 'ADMIN') {
             // If user is just a USER, redirect home
             if (role === 'USER') {
                console.warn('User is not authorized for dashboard. Role:', role);
                // router.push('/'); // Commented out for debugging
             }
        } else {
            fetchProducts();
        }
    }
  }, [status, session, router]);

  const fetchProducts = async () => {
    setLoadingList(true);
    try {
      // The API now checks the session cookie automatically
      const response = await axios.get('/api/admin/products');
      setProducts(response.data);
      setMessage('');
    } catch (error: any) {
      console.error(error);
      setMessage('Failed to fetch products.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
    
    try {
      await axios.delete(`/api/admin/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
      setMessage('Product deleted successfully');
    } catch (error: any) {
      console.error(error);
      setMessage('Failed to delete product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage('');
    
    const formData = new FormData();
    // Append text fields first for better server handling
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('file', file);
    if (icon) formData.append('icon', icon);

    try {
      await axios.post('/api/admin/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Product uploaded successfully!');
      setTitle('');
      setDescription('');
      setPrice('');
      setFile(null);
      setIcon(null);
      // Reset file inputs
      (document.getElementById('file-upload') as HTMLInputElement).value = '';
      const iconInput = document.getElementById('icon-upload') as HTMLInputElement;
      if (iconInput) iconInput.value = '';
      
      fetchProducts(); // Refresh list
    } catch (error: any) {
      console.error(error);
      setMessage(error.response?.data?.error || 'Failed to upload product.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
      return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading session...</div>;
  }

  if (status === 'unauthenticated') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p>You are not signed in.</p>
              <div className="flex gap-4">
                  <button onClick={() => router.push('/login')} className="bg-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-700">Go to Login</button>
                  <a href="/debug-auth" className="bg-red-900 px-4 py-2 rounded font-bold hover:bg-red-800 border border-red-700">Debug Auth</a>
              </div>
              <pre className="bg-gray-900 p-4 rounded text-xs text-left mt-4 border border-gray-800">
                  Status: {status}<br/>
                  Session: {JSON.stringify(session, null, 2)}
              </pre>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Creator Dashboard</h1>
                <p className="text-gray-400">Manage your models and sales.</p>
            </div>
            <a href="/account" className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
            My Account
            </a>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Form */}
            <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 h-fit">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                Upload New Model
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black border border-gray-800 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
                    required
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black border border-gray-800 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
                    rows={4}
                    required
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Price ($)</label>
                <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-black border border-gray-800 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
                    required
                    step="0.01"
                    min="0"
                />
                </div>
                
                <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Icon Image (Optional)</label>
                <input
                    id="icon-upload"
                    type="file"
                    onChange={(e) => setIcon(e.target.files?.[0] || null)}
                    className="w-full bg-black border border-gray-800 p-2 rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    accept="image/*"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Upload an image (PNG, JPG) to display on the marketplace listing.
                </p>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Model ZIP File</label>
                <input
                    id="file-upload"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full bg-black border border-gray-800 p-2 rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    accept=".zip"
                    required
                />
                <p className="text-xs text-gray-500 mt-1">
                    Upload a ZIP file containing the Live2D model assets. 
                    Must include a valid .model3.json file.
                </p>
                </div>
                <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20"
                >
                {loading ? 'Uploading...' : 'Upload Product'}
                </button>
                {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${message.includes('success') || message.includes('deleted') ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                    {message}
                </div>
                )}
            </form>
            </div>

            {/* Product List */}
            <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 h-fit">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Your Models</h2>
                    <button 
                    onClick={fetchProducts} 
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    disabled={loadingList}
                    >
                    {loadingList ? 'Loading...' : 'Refresh List'}
                    </button>
                </div>
                
                {products.length === 0 ? (
                    <div className="text-gray-500 text-center py-12 bg-black/20 rounded-xl border border-gray-800 border-dashed">
                        {loadingList ? 'Loading products...' : 'You haven\'t uploaded any models yet.'}
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {products.map((product) => (
                            <div key={product.id} className="bg-black/40 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                            {product.iconUrl ? (
                                                <img src={product.iconUrl} alt={product.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                                                    {product.title.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-200">{product.title}</h3>
                                            <p className="text-xs text-gray-500 font-mono truncate max-w-[150px]">{product.id}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${product.isSold ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-green-900/30 text-green-400 border border-green-800'}`}>
                                        {product.isSold ? 'SOLD' : 'AVAILABLE'}
                                    </span>
                                </div>
                                
                                <div className="text-sm text-gray-400 line-clamp-2">
                                    {product.description}
                                </div>
                                
                                <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                                    <span className="font-bold text-lg text-white">${product.price}</span>
                                    <div className="flex gap-2">
                                        <a 
                                            href={`/product/${product.slug || product.id}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors border border-gray-700"
                                        >
                                            View Page
                                        </a>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 px-3 py-1.5 rounded-lg transition-colors font-medium border border-red-900/30"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatorDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
