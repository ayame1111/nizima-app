import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();

  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    redirect("/");
  }

  // Fetch products (you might want to paginate this in a real app)
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { seller: true }
  });

  return (
    <div className="min-h-screen bg-black text-gray-100 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Simple Breadcrumb */}
      <div className="max-w-6xl mx-auto py-6 text-sm text-gray-400">
        <Link href="/" className="hover:text-white">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Admin Panel</span>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-gray-400">Manage products and system settings.</p>
            </div>
            
            <Link href="/admin/users" className="bg-blue-900/50 border border-blue-800 text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-900/80 transition-colors font-medium">
                Manage Users
            </Link>
        </div>
        
        {/* Placeholder for Product Management List */}
        <div className="bg-[#111] rounded-2xl border border-gray-800 p-8 text-center">
            <p className="text-gray-400">Product management features coming soon.</p>
        </div>
      </div>
    </div>
  );
}
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload New Model</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                  required
                  placeholder="Enter admin secret"
                />
                <button 
                  type="button"
                  onClick={fetchProducts}
                  className="bg-gray-800 text-white px-4 rounded hover:bg-gray-700 text-sm whitespace-nowrap"
                >
                  Load Products
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
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
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
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
                className="w-full border border-gray-300 p-2 rounded text-black"
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
                className="w-full border border-gray-300 p-2 rounded text-black"
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
              className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Uploading...' : 'Upload Product'}
            </button>
            {message && (
              <div className={`mt-4 p-3 rounded text-sm ${message.includes('success') || message.includes('deleted') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
          </form>
        </div>

        {/* Product List */}
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Existing Models</h2>
                <button 
                  onClick={fetchProducts} 
                  className="text-sm text-blue-600 hover:underline"
                  disabled={loadingList}
                >
                  {loadingList ? 'Loading...' : 'Refresh List'}
                </button>
            </div>
            
            {products.length === 0 ? (
                <div className="text-gray-500 text-center py-8 bg-gray-50 rounded">
                    {loadingList ? 'Loading products...' : 'No products found. Load with Admin Key.'}
                </div>
            ) : (
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                    {products.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{product.title}</h3>
                                    <p className="text-xs text-gray-500 font-mono">{product.id}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${product.isSold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {product.isSold ? 'SOLD' : 'AVAILABLE'}
                                </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 line-clamp-2">
                                {product.description}
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <span className="font-bold text-lg text-gray-800">${product.price}</span>
                                <div className="flex gap-2">
                                    <a 
                                        href={`/product/${product.slug || product.id}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded transition-colors"
                                    >
                                        View Page
                                    </a>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded transition-colors font-medium"
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
  );
}
