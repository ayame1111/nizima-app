import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  const session = await auth();

  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    redirect("/");
  }

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
        
        <AdminDashboardClient />
      </div>
    </div>
  );
}
