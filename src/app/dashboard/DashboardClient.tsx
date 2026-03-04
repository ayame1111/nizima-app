'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface DashboardClientProps {
  user: any;
}

function DashboardContent({ user }: DashboardClientProps) {
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
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');
  
  // Batch Upload State
  interface BatchFile {
    id: string;
    file: File;
    title: string;
    price: string;
    description: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
  }
  
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [globalPrice, setGlobalPrice] = useState('');
  const [globalDescription, setGlobalDescription] = useState('');

  // Use the passed user prop instead of useSession
  useEffect(() => {
    // If we're here, we are already authenticated by the server component wrapper
    // But check role if needed
    // @ts-ignore
    const role = user?.role;
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
  }, [user, router]);

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

  const handleBatchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const newFiles = Array.from(e.target.files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            title: file.name.replace('.zip', '').replace(/[-_]/g, ' '),
            price: globalPrice,
            description: globalDescription,
            status: 'pending' as const,
            progress: 0
        }));
        setBatchFiles(prev => [...prev, ...newFiles]);
        // Reset input
        e.target.value = '';
    }
  };

  const removeBatchFile = (id: string) => {
    setBatchFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateBatchFile = (id: string, field: keyof BatchFile, value: any) => {
    setBatchFiles(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleBatchUpload = async () => {
    setLoading(true);
    setMessage('');

    const pendingFiles = batchFiles.filter(f => f.status === 'pending' || f.status === 'error');
    
    if (pendingFiles.length === 0) {
        alert('No pending files to upload.');
        setLoading(false);
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const batchFile of pendingFiles) {
        // Update status to uploading
        updateBatchFile(batchFile.id, 'status', 'uploading');
        
        const formData = new FormData();
        formData.append('title', batchFile.title);
        formData.append('description', batchFile.description);
        formData.append('price', batchFile.price);
        formData.append('file', batchFile.file);
        // Note: Batch upload currently doesn't support individual icons per file for simplicity, 
        // unless we add an icon picker for each row.
        
        try {
            await axios.post('/api/admin/products', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
                    updateBatchFile(batchFile.id, 'progress', percentCompleted);
                }
            });
            updateBatchFile(batchFile.id, 'status', 'success');
            updateBatchFile(batchFile.id, 'progress', 100);
            successCount++;
        } catch (error: any) {
            console.error(`Failed to upload ${batchFile.title}:`, error);
            updateBatchFile(batchFile.id, 'status', 'error');
            updateBatchFile(batchFile.id, 'error', error.response?.data?.error || error.message);
            failCount++;
        }
    }

    setLoading(false);
    fetchProducts();
    
    if (failCount === 0) {
        setMessage(`Successfully uploaded ${successCount} products!`);
        // Optional: Clear successful uploads
        // setBatchFiles(prev => prev.filter(f => f.status !== 'success'));
    } else {
        setMessage(`Uploaded ${successCount} products. ${failCount} failed.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called');
    
    if (!file) {
        console.log('No file selected');
        alert('Please select a ZIP file first.');
        return;
    }

    console.log('Starting upload...', { title, description, price, fileName: file.name, fileSize: file.size });
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
      console.log('Sending request to /api/admin/products...');
      const response = await axios.post('/api/admin/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
            console.log(`Upload progress: ${percentCompleted}%`);
        }
      });
      console.log('Upload success:', response.data);
      setMessage('Product uploaded successfully!');
      setTitle('');
      setDescription('');
      setPrice('');
      setFile(null);
      setIcon(null);
      // Reset file inputs
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      const iconInput = document.getElementById('icon-upload') as HTMLInputElement;
      if (iconInput) iconInput.value = '';
      
      fetchProducts(); // Refresh list
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to upload product.';
      setMessage(`Error: ${errorMsg}`);
      alert(`Upload failed: ${errorMsg}`);
    } finally {
      setLoading(false);
      console.log('Upload finished (finally block)');
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Upload New Model
                </h2>
                <div className="flex bg-gray-900 rounded-lg p-1">
                    <button 
                        onClick={() => setUploadMode('single')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${uploadMode === 'single' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Single
                    </button>
                    <button 
                        onClick={() => setUploadMode('batch')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${uploadMode === 'batch' ? 'bg-blue-900/50 text-blue-200' : 'text-gray-400 hover:text-white'}`}
                    >
                        Batch
                    </button>
                </div>
            </div>

            {uploadMode === 'single' ? (
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
            </form>
            ) : (
                <div className="space-y-4">
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                        <h3 className="text-sm font-bold text-gray-300 mb-3">Default Settings</h3>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Default Price ($)</label>
                                <input
                                    type="number"
                                    value={globalPrice}
                                    onChange={(e) => setGlobalPrice(e.target.value)}
                                    className="w-full bg-black border border-gray-800 p-2 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-white text-sm"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Default Description</label>
                                <input
                                    type="text"
                                    value={globalDescription}
                                    onChange={(e) => setGlobalDescription(e.target.value)}
                                    className="w-full bg-black border border-gray-800 p-2 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-white text-sm"
                                    placeholder="Description for all files..."
                                />
                            </div>
                        </div>
                        
                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                accept=".zip"
                                onChange={handleBatchFileSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:bg-gray-800/50 transition-colors">
                                <p className="text-gray-400 font-medium">Click or Drag ZIP files here</p>
                                <p className="text-xs text-gray-600 mt-1">Select multiple files to batch upload</p>
                            </div>
                        </div>
                    </div>

                    {batchFiles.length > 0 && (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                            {batchFiles.map((file, index) => (
                                <div key={file.id} className="bg-black/40 border border-gray-800 rounded p-3 text-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 mr-2">
                                            <input 
                                                value={file.title}
                                                onChange={(e) => updateBatchFile(file.id, 'title', e.target.value)}
                                                className="bg-transparent border-b border-transparent hover:border-gray-700 focus:border-blue-500 outline-none text-white font-medium w-full"
                                                placeholder="Title"
                                            />
                                            <div className="text-xs text-gray-500 mt-0.5">{file.file.name} ({(file.file.size / 1024 / 1024).toFixed(2)} MB)</div>
                                        </div>
                                        <button onClick={() => removeBatchFile(file.id)} className="text-gray-600 hover:text-red-400">
                                            ×
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-2 mb-2">
                                        <input 
                                            type="number"
                                            value={file.price}
                                            onChange={(e) => updateBatchFile(file.id, 'price', e.target.value)}
                                            className="bg-black border border-gray-800 rounded px-2 py-1 w-20 text-white"
                                            placeholder="Price"
                                        />
                                        <input 
                                            value={file.description}
                                            onChange={(e) => updateBatchFile(file.id, 'description', e.target.value)}
                                            className="bg-black border border-gray-800 rounded px-2 py-1 flex-1 text-white"
                                            placeholder="Description"
                                        />
                                    </div>

                                    {file.status !== 'pending' && (
                                        <div className="mt-2">
                                            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-300 ${
                                                        file.status === 'success' ? 'bg-green-500' : 
                                                        file.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${file.progress}%` }}
                                                />
                                            </div>
                                            {file.error && <p className="text-xs text-red-400 mt-1">{file.error}</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleBatchUpload}
                        disabled={loading || batchFiles.length === 0}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20"
                    >
                        {loading ? `Uploading ${batchFiles.filter(f => f.status === 'pending').length} Files...` : 'Upload All Files'}
                    </button>
                </div>
            )}

            {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${message.includes('success') || message.includes('deleted') ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                {message}
            </div>
            )}
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

export default function CreatorDashboard({ user }: DashboardClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>}>
      <DashboardContent user={user} />
    </Suspense>
  );
}
