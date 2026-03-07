
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle, Download, Home } from 'lucide-react';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    redirect('/');
  }

  // 1. Retrieve the session to verify payment
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Failed or Incomplete</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">It looks like your payment wasn't successful. Please try again.</p>
        <Link href="/" className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  // 2. Get the product details (via metadata or line items)
  // We used metadata.productId in the checkout creation
  const productId = session.metadata?.productId;
  
  if (!productId) {
      // Fallback if metadata is missing (shouldn't happen)
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
              <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
              <p>But we couldn't find the product details. Please contact support.</p>
          </div>
      )
  }

  const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { creator: true }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-800">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Your purchase of <span className="font-bold text-gray-900 dark:text-white">{product?.title}</span> was successful.
        </p>

        <div className="space-y-4">
          <Link 
            href={`/api/download/${session.id}`} // We need to create this download route too!
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Download size={20} />
            Download Files
          </Link>
          
          <Link 
            href="/"
            className="block w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
        
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
            Order ID: {session.id.slice(-8)}
        </p>
      </div>
    </div>
  );
}
