import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { updatePassword } from "@/app/actions/account";
import { Download, Package } from "lucide-react";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const purchases = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
        product: {
            include: { seller: true }
        }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-500">
         <Link href="/" className="hover:text-gray-900">Home</Link>
         <span className="mx-2">/</span>
         <span className="text-gray-900 font-medium">My Account</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
           <p className="text-gray-500">Manage your profile and purchases.</p>
        </div>

        {/* Purchases Section */}
        <div className="mt-8 border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Purchased Models</h2>
          
          {purchases.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-black/20 rounded-xl border border-gray-800 border-dashed">
              <p>You haven't purchased any models yet.</p>
              <Link href="/" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {purchase.product.iconUrl ? (
                           <img src={purchase.product.iconUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package size={32} />
                          </div>
                      )}
                  </div>
                  <div className="p-4">
                       <h3 className="font-bold text-gray-900 truncate">{purchase.product.title}</h3>
                       <p className="text-sm text-gray-500 mb-4 truncate">{purchase.product.seller?.name || 'Unknown Artist'}</p>
                       
                       <a href={`/api/download/${purchase.id}`} className="block w-full text-center bg-gray-900 text-white py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                           Download
                       </a>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Section */}
        <div className="bg-[#111] rounded-2xl border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Security</h2>
          <form action={async (formData) => {
              'use server'
              await updatePassword(formData);
          }} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
              <input 
                type="password" 
                name="currentPassword"
                required
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
              <input 
                type="password" 
                name="newPassword"
                required
                minLength={6}
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                required
                minLength={6}
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button 
              type="submit"
              className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
