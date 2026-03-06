import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Only CREATOR or ADMIN can edit detailed profile?
  // The user prompt said: "Creators should be able to add it from "Profile" page"
  // But regular users might want to edit their profile too?
  // For now, let's allow everyone to edit, but only CREATOR profile fields (bio/social) might be useful.
  // Actually, regular users might want to change avatar too.
  // Let's restrict Bio/Social to Creators? Or just let everyone have it.
  // The requirement says "a creator has a portfolio page... Creators should be able to add it".
  // I'll check role.

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect('/login');
  }

  // Optional: Redirect if not creator?
  // if (user.role !== 'CREATOR' && user.role !== 'ADMIN') {
  //   return <div>Only creators can edit their public profile. <Link href="/become-creator">Become a Creator</Link></div>
  // }
  // But maybe regular users want to edit avatar. So let's allow it but maybe hide bio/social for non-creators?
  // For simplicity, I'll show it for everyone, as "Profile" implies user profile.
  // But the prompt specifically talks about Creator Portfolio.
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
         <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
            <h1 className="font-bold text-xl">Profile Settings</h1>
         </div>
      </div>
      
      <ProfileForm user={user} />
    </div>
  );
}
