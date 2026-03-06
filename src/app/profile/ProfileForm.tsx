'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Save, Loader2, User as UserIcon, CheckCircle2 } from 'lucide-react';

interface ProfileFormProps {
  user: any;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [bio, setBio] = useState(user.bio || '');
  const [banner, setBanner] = useState<string | null>(user.bannerUrl);
  const [avatar, setAvatar] = useState<string | null>(user.image);
  const [socialLinks, setSocialLinks] = useState({
    twitter: user.socialLinks?.twitter || '',
    youtube: user.socialLinks?.youtube || '',
    website: user.socialLinks?.website || '',
    instagram: user.socialLinks?.instagram || '',
  });

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'banner');

    try {
      const res = await fetch('/api/user/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setBanner(data.url);
        router.refresh();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error('Banner upload failed', err);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'avatar');

    try {
      const res = await fetch('/api/user/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setAvatar(data.url);
        router.refresh();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error('Avatar upload failed', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('bio', bio);
    formData.append('twitter', socialLinks.twitter);
    formData.append('youtube', socialLinks.youtube);
    formData.append('website', socialLinks.website);
    formData.append('instagram', socialLinks.instagram);

    try {
        // Use server action via fetch or directly if imported
        // Since we are in client component, we can call server action directly if imported
        // But for simplicity let's use a server action wrapper or just assume it works
        // Wait, I created src/app/actions/profile.ts
        const { updateProfile } = await import('@/app/actions/profile');
        const result = await updateProfile(formData);
        
        if (result.success) {
            router.refresh();
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    } catch (error) {
        console.error('Update failed', error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Banner & Avatar Section */}
        <div className="relative group mb-16">
            {/* Banner Container */}
            <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 h-48 md:h-64 border border-gray-200 dark:border-gray-700 relative">
                {banner ? (
                    <img src={banner} alt="Profile Banner" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Banner Image
                    </div>
                )}
                
                {/* Banner Upload Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <label className="cursor-pointer bg-white/90 text-gray-900 px-4 py-2 rounded-full font-medium shadow-lg hover:bg-white transition-colors flex items-center gap-2">
                        <Camera size={18} /> Change Banner
                        <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                    </label>
                </div>
            </div>

            {/* Avatar - Absolute Positioned */}
            <div className="absolute -bottom-12 left-8 md:left-12">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 overflow-hidden group/avatar shadow-lg">
                    {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-400">
                            <UserIcon size={40} />
                        </div>
                    )}
                    
                    {/* Avatar Upload Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/avatar:opacity-100">
                        <label className="cursor-pointer text-white p-2 rounded-full hover:bg-white/20 transition-colors">
                            <Camera size={20} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="md:col-span-2 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                    <input 
                        type="text" 
                        value={user.name || ''} 
                        disabled 
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Display name cannot be changed directly.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                    <textarea 
                        rows={5}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        placeholder="Tell us about yourself..."
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">{bio.length}/500</p>
                </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Social Links</h3>
                
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Twitter / X</label>
                    <input 
                        type="url"
                        value={socialLinks.twitter}
                        onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="https://twitter.com/..."
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">YouTube</label>
                    <input 
                        type="url"
                        value={socialLinks.youtube}
                        onChange={(e) => setSocialLinks({...socialLinks, youtube: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="https://youtube.com/..."
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Instagram</label>
                    <input 
                        type="url"
                        value={socialLinks.instagram}
                        onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="https://instagram.com/..."
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Website</label>
                    <input 
                        type="url"
                        value={socialLinks.website}
                        onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="https://..."
                    />
                </div>
            </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
            <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Changes
            </button>
        </div>
      </form>

      {/* Toast Notification */}
      <div className={`fixed bottom-8 right-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 z-50 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle2 className="text-green-500" size={24} />
        <div>
            <h4 className="font-bold">Success</h4>
            <p className="text-sm opacity-90">Profile updated successfully!</p>
        </div>
      </div>
    </div>
  );
}
