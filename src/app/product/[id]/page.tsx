import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductPurchase from '@/components/ProductPurchase';
import LazyLive2DViewer from '@/components/LazyLive2DViewer';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4 md:p-8 text-gray-100 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        <Link href="/" className="text-gray-400 hover:text-white mb-6 inline-flex items-center transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Marketplace
        </Link>
        
        <div className="bg-[#252525] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-5 border border-gray-800 w-full">
          {/* Left: Preview (Larger area) */}
          <div className="lg:col-span-3 bg-[#1e1e1e] relative h-[400px] sm:h-[500px] lg:h-auto lg:min-h-[600px] border-b lg:border-b-0 lg:border-r border-gray-800 flex items-center justify-center w-full">
            {product.previewUrl ? (
              <LazyLive2DViewer modelUrl={product.previewUrl} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">No Preview Available</div>
            )}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none px-4 text-center">
              <span className="bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full text-xs md:text-sm font-medium text-white/90 shadow-lg border border-white/10">
                Click to Interact & Control
              </span>
            </div>
          </div>
          
          {/* Right: Details */}
          <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col bg-[#252525]">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-5">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${product.isSold ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                   {product.isSold ? 'Sold Out' : 'Available'}
                 </span>
                 <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                   One-of-a-kind
                 </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">{product.title}</h1>
              <div className="text-3xl font-light text-gray-200 mb-8 border-b border-gray-700 pb-6">
                {formatCurrency(product.price)}
              </div>
            </div>
            
            <div className="prose prose-invert prose-lg text-gray-300 mb-10 flex-grow">
              <h3 className="text-lg font-semibold text-white mb-3 uppercase tracking-wide text-sm opacity-70">About this Model</h3>
              <p className="whitespace-pre-wrap leading-relaxed opacity-90">{product.description}</p>
            </div>
            
            <div className="mt-auto bg-[#2a2a2a] p-6 rounded-2xl border border-gray-700 shadow-inner">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span>Purchase License</span>
                <div className="h-px bg-gray-600 flex-grow ml-2"></div>
              </h3>
              <ProductPurchase 
                product={{
                  id: product.id,
                  price: product.price,
                  isSold: product.isSold
                }} 
              />
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                <span>Secure encrypted transaction via PayPal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
