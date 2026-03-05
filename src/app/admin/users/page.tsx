import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { updateUserRole, assignCreatorRoleByEmail } from "@/app/actions/admin";
import Link from "next/link";
import { Search } from "lucide-react";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const session = await auth();
  const query = (await searchParams).q || "";

  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50 // Limit to 50 for performance
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
                <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                <p className="text-gray-400">Manage user roles and permissions.</p>
            </div>
            {/* Admin Dashboard Link - Back to Product Management */}
            <Link href="/admin" className="text-blue-400 hover:text-blue-300">
                Manage Products
            </Link>
        </div>

        {/* Quick Assign Creator Role */}
        <div className="bg-[#111] p-6 rounded-2xl border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Quick Assign Creator Role</h2>
            <p className="text-gray-400 mb-4 text-sm">Enter an email address to instantly upgrade a user to Creator status.</p>
            <form action={async (formData) => {
                'use server'
                await assignCreatorRoleByEmail(formData)
            }} className="flex gap-4">
                <input 
                    type="email" 
                    name="email" 
                    placeholder="user@example.com" 
                    required
                    className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Make Creator
                </button>
            </form>
        </div>

        {/* Search & List */}
        <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex gap-4">
                 <form className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            name="q" 
                            defaultValue={query}
                            placeholder="Search users..." 
                            className="w-full bg-black border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium">
                        Search
                    </button>
                 </form>
            </div>
            
            <table className="w-full text-left">
                <thead className="bg-gray-900 border-b border-gray-800">
                    <tr>
                        <th className="px-6 py-4 text-sm font-bold text-gray-400">User</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-400">Email</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-400">Role</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-400">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-6 py-4 flex items-center gap-3">
                                {user.image ? (
                                    <img src={user.image} className="w-8 h-8 rounded-full" />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
                                        {user.name?.charAt(0) || user.email.charAt(0)}
                                    </div>
                                )}
                                <span className="font-medium text-white">{user.name || 'No Name'}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-400">{user.email}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold 
                                    ${user.role === 'ADMIN' ? 'bg-purple-900/30 text-purple-400 border border-purple-800' : 
                                      user.role === 'CREATOR' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 
                                      'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <form action={async (formData) => {
                                    'use server'
                                    await updateUserRole(formData)
                                }} className="flex gap-2">
                                    <input type="hidden" name="userId" value={user.id} />
                                    <select name="role" defaultValue={user.role} className="bg-black border border-gray-700 rounded px-2 py-1 text-sm text-gray-300">
                                        <option value="USER">User</option>
                                        <option value="CREATOR">Creator</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                    <button type="submit" className="text-xs bg-white text-black px-3 py-1 rounded hover:bg-gray-200 font-bold">
                                        Update
                                    </button>
                                </form>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
