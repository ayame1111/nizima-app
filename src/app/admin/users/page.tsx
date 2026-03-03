import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { updateUserRole } from "@/app/actions/admin";
import Link from "next/link";

export default async function AdminUsersPage() {
  const session = await auth();

  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-black text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                <p className="text-gray-400">Manage user roles and permissions.</p>
            </div>
            <Link href="/admin" className="text-blue-400 hover:text-blue-300">
                Back to Dashboard
            </Link>
        </div>

        <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden">
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
                                <form action={updateUserRole} className="flex gap-2">
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
