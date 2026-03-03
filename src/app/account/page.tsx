import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { updatePassword } from "@/app/actions/account";
import { Download, Package } from "lucide-react";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const purchases = await prisma.order.findMany({
    where: {
      buyerEmail: session.user.email as string,
      status: "COMPLETED",
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-black text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Account</h1>
          <p className="text-gray-400">Manage your purchases and account settings.</p>
        </div>

        {/* Purchases Section */}
        <div className="bg-[#111] rounded-2xl border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Package className="text-blue-500" />
            Purchased Models
          </h2>
          
          {purchases.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-black/20 rounded-xl border border-gray-800 border-dashed">
              <p>You haven't purchased any models yet.</p>
              <Link href="/" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((order) => (
                <div key={order.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg overflow-hidden relative">
                        {order.product.iconUrl ? (
                            <img src={order.product.iconUrl} alt={order.product.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                                {order.product.title.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{order.product.title}</h3>
                      <p className="text-sm text-gray-500">Purchased on {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Link 
                    href={`/api/download/${order.id}`}
                    className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-600/20"
                  >
                    <Download size={16} />
                    Download
                  </Link>
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
