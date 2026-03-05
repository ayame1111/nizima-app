'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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



  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8 pt-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your Live2D models and sales.</p>
          </div>
          <Link href="/account" className="bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm">
             My Account
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Upload New Model
                </h2>
                <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                    <button 
                        onClick={() => setUploadMode('single')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${uploadMode === 'single' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Single
                    </button>
                    <button 
                        onClick={() => setUploadMode('batch')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${uploadMode === 'batch' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Batch
                    </button>
                </div>
            </div>

            {uploadMode === 'single' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 transition-all"
                    required
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 transition-all"
                    rows={4}
                    required
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 transition-all"
                    required
                    step="0.01"
                    min="0"
                />
                </div>
                
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon Image (Optional)</label>
                <input
                    id="icon-upload"
                    type="file"
                    onChange={(e) => setIcon(e.target.files?.[0] || null)}
                    className="w-full bg-white border border-gray-200 p-2 rounded-lg text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                    accept="image/*"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Upload an image (PNG, JPG) to display on the marketplace listing.
                </p>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model ZIP File</label>
                <input
                    id="file-upload"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full bg-white border border-gray-200 p-2 rounded-lg text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
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
                className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-lg shadow-gray-900/10"
                >
                {loading ? 'Uploading...' : 'Upload Product'}
                </button>
            </form>
            ) : (
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Default Settings</h3>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Default Price ($)</label>
                                <input
                                    type="number"
                                    value={globalPrice}
                                    onChange={(e) => setGlobalPrice(e.target.value)}
                                    className="w-full bg-white border border-gray-200 p-2 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-900 text-sm"
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
                                    className="w-full bg-white border border-gray-200 p-2 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-900 text-sm"
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
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors bg-white">
                                <p className="text-gray-600 font-medium">Click or Drag ZIP files here</p>
                                <p className="text-xs text-gray-400 mt-1">Select multiple files to batch upload</p>
                            </div>
                        </div>
                    </div>

                    {batchFiles.length > 0 && (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                            {batchFiles.map((file, index) => (
                                <div key={file.id} className="bg-white border border-gray-200 rounded p-3 text-sm shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 mr-2">
                                            <input 
                                                value={file.title}
                                                onChange={(e) => updateBatchFile(file.id, 'title', e.target.value)}
                                                className="bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none text-gray-900 font-medium w-full"
                                                placeholder="Title"
                                            />
                                            <div className="text-xs text-gray-400 mt-0.5">{file.file.name} ({(file.file.size / 1024 / 1024).toFixed(2)} MB)</div>
                                        </div>
                                        <button onClick={() => removeBatchFile(file.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            ×
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-2 mb-2">
                                        <input 
                                            type="number"
                                            value={file.price}
                                            onChange={(e) => updateBatchFile(file.id, 'price', e.target.value)}
                                            className="bg-gray-50 border border-gray-200 rounded px-2 py-1 w-20 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Price"
                                        />
                                        <input 
                                            value={file.description}
                                            onChange={(e) => updateBatchFile(file.id, 'description', e.target.value)}
                                            className="bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Description"
                                        />
                                    </div>

                                    {file.status !== 'pending' && (
                                        <div className="mt-2">
                                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-300 ${
                                                        file.status === 'success' ? 'bg-green-500' : 
                                                        file.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${file.progress}%` }}
                                                />
                                            </div>
                                            {file.error && <p className="text-xs text-red-500 mt-1">{file.error}</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleBatchUpload}
                        disabled={loading || batchFiles.length === 0}
                        className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-lg shadow-gray-900/10"
                    >
                        {loading ? `Uploading ${batchFiles.filter(f => f.status === 'pending').length} Files...` : 'Upload All Files'}
                    </button>
                </div>
            )}

            {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${message.includes('success') || message.includes('deleted') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {message}
            </div>
            )}
            </div>

            {/* Product List */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Your Models</h2>
                    <button 
                    onClick={fetchProducts} 
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    disabled={loadingList}
                    >
                    {loadingList ? 'Loading...' : 'Refresh List'}
                    </button>
                </div>
                
                {products.length === 0 ? (
                    <div className="text-gray-500 text-center py-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                        {loadingList ? 'Loading products...' : 'You haven\'t uploaded any models yet.'}
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {product.iconUrl ? (
                                                <img src={product.iconUrl} alt={product.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                                    {product.title.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{product.title}</h3>
                                            <p className="text-xs text-gray-400 font-mono truncate max-w-[150px]">{product.id}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${product.isSold ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                        {product.isSold ? 'SOLD' : 'AVAILABLE'}
                                    </span>
                                </div>
                                
                                <div className="text-sm text-gray-500 line-clamp-2">
                                    {product.description}
                                </div>
                                
                                <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                    <span className="font-bold text-lg text-gray-900">${product.price}</span>
                                    <div className="flex gap-2">
                                        <a 
                                            href={`/product/${product.slug || product.id}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors border border-gray-200 font-medium"
                                        >
                                            View Page
                                        </a>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-xs bg-white hover:bg-red-50 text-red-500 px-3 py-1.5 rounded-lg transition-colors font-medium border border-red-100 hover:border-red-200"
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
