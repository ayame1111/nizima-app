import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { updatePassword } from "@/app/actions/account";
import { Heart, Download, Package } from "lucide-react";
import { Order, Product, User } from "@prisma/client";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const purchases = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
        items: {
            include: { 
                product: {
                    include: { creator: true }
                }
            }
        }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pb-20 transition-colors duration-300">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-500 dark:text-gray-400">
         <Link href="/" className="hover:text-gray-900 dark:hover:text-white">Home</Link>
         <span className="mx-2">/</span>
         <span className="text-gray-900 dark:text-white font-medium">My Account</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
           <div>
               <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Account</h1>
               <p className="text-gray-500 dark:text-gray-400">Manage your profile and purchases.</p>
           </div>
           <Link href="/favorites" className="flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-lg font-bold hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors">
               <Heart size={18} className="fill-current" />
               <span>My Favorites</span>
           </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Purchases Section */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchased Models</h2>
                
                {purchases.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={32} />
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium mb-2">No purchases yet</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">You haven't purchased any models yet.</p>
                        <Link href="/" className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm">
                            Browse Marketplace
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                    {purchases.flatMap((purchase) => 
                        purchase.items.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex gap-4 items-center transition-colors duration-300">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                                {item.product.iconUrl ? (
                                    <img src={item.product.iconUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                        <Package size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow min-w-0">
                                <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.product.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.product.creator?.name || 'Unknown Artist'}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Purchased on {new Date(purchase.createdAt).toLocaleDateString()}</p>
                            </div>
                            <a 
                                href={`/api/download/${purchase.id}`} 
                                className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                                title="Download"
                            >
                                <Download size={20} />
                            </a>
                        </div>
                    )))}
                    </div>
                )}
            </div>

            {/* Security Section */}
            <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 sticky top-24 transition-colors duration-300">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Security</h2>
                    <form action={async (formData) => {
                        'use server'
                        await updatePassword(formData);
                    }} className="space-y-4">
                        <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                        <input 
                            type="password" 
                            name="currentPassword"
                            required
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                        <input 
                            type="password" 
                            name="newPassword"
                            required
                            minLength={6}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                        <input 
                            type="password" 
                            name="confirmPassword"
                            required
                            minLength={6}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        </div>
                        <button 
                        type="submit"
                        className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors mt-2"
                        >
                        Update Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
