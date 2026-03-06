import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductPurchase from '@/components/ProductPurchase';
import LazyLive2DViewer from '@/components/LazyLive2DViewer';
import ProductGallery from '@/components/ProductGallery';
import ExpandableDescription from '@/components/ExpandableDescription';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { creator: true }
  });

  if (!product) {
    return {
      title: 'Product Not Found - Nizima App',
    };
  }

  return {
    title: `${product.title} - Nizima App`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.iconUrl ? [product.iconUrl] : [],
    },
  };
}

import { auth } from '@/auth';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { creator: true }
  });

  if (!product) {
    notFound();
  }

  // Security check for pending/rejected products
  // @ts-ignore
  const isCreator = session?.user?.id === product.creatorId;
  // @ts-ignore
  const isAdmin = session?.user?.role === 'ADMIN';

  if (product.status !== 'APPROVED' && !isCreator && !isAdmin) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-500 dark:text-gray-400">
         <Link href="/" className="hover:text-gray-900 dark:hover:text-white">Home</Link>
         <span className="mx-2">/</span>
         <span className="text-gray-900 dark:text-white font-medium truncate">{product.title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Preview (Larger area) */}
          <div className="lg:col-span-3">
             <div className="bg-gray-900 dark:bg-gray-100 rounded-3xl shadow-xl overflow-hidden relative h-[400px] sm:h-[500px] lg:h-auto lg:min-h-[600px] flex items-center justify-center w-full border border-gray-100 dark:border-gray-800">
                {product.previewUrl ? (
                <LazyLive2DViewer modelUrl={product.previewUrl} className="w-full h-full" />
                ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">No Preview Available</div>
                )}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none px-4 text-center">
                <span className="bg-gray-800/80 dark:bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full text-xs md:text-sm font-medium text-white dark:text-gray-900 shadow-lg border border-gray-700 dark:border-gray-200 transition-colors duration-300">
                    Click to Interact & Control
                </span>
                </div>
             </div>

             {/* Description moved here, under the viewer */}
             <div className="mt-8 bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
                <ExpandableDescription description={product.description} />
             </div>
          </div>
          
          {/* Right: Details */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden p-8 lg:p-10 flex flex-col border border-gray-100 dark:border-gray-800 transition-colors duration-300 h-fit sticky top-24">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-5">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${product.isSold ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' : 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30'}`}>
                   {product.isSold ? 'Sold Out' : 'Available'}
                 </span>
                 <span className="bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                   One-of-a-kind
                 </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight tracking-tight transition-colors duration-300">{product.title}</h1>
              <div className="text-3xl font-light text-gray-600 dark:text-gray-200 mb-8 border-b border-gray-100 dark:border-gray-700 pb-6 transition-colors duration-300">
                {formatCurrency(product.price)}
              </div>
            </div>
            
            <div className="mt-auto bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-inner transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2 transition-colors duration-300">
                <span>Purchase License</span>
                <div className="h-px bg-gray-200 dark:bg-gray-600 flex-grow ml-2 transition-colors duration-300"></div>
              </h3>
              <ProductPurchase 
                product={{
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  isSold: product.isSold,
                  iconUrl: product.iconUrl,
                  creatorName: product.creator?.name || 'Unknown Artist'
                }} 
              />
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400 dark:text-gray-500 transition-colors duration-300">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                <span>Secure encrypted transaction via PayPal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Media Gallery */}
        {product.mediaUrls && product.mediaUrls.length > 0 && (
            <ProductGallery mediaUrls={product.mediaUrls} />
        )}
      </div>
    </div>
  );
}
