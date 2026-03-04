import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Redirect non-creators to the creator application page
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/become-creator');
  }

  return (
    <div className="min-h-screen bg-gray-50">
       {/* Breadcrumb */}
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Dashboard</span>
       </div>
       
       <DashboardClient user={session.user} />
    </div>
  );
}
