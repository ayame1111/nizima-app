'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';

interface AdminControlsProps {
  productId: string;
}

export default function AdminControls({ productId }: AdminControlsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // @ts-ignore
  const isAdmin = session?.user?.role === 'ADMIN';

  if (!isAdmin) return null;

  const handleDelete = async () => {
    if (!confirm('ADMIN ACTION: Are you sure you want to delete this product? This cannot be undone.')) return;

    setLoading(true);
    try {
      await axios.delete(`/api/admin/products/${productId}`);
      router.push('/marketplace');
      router.refresh();
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete product');
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-xl shadow-lg flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
        <AlertTriangle size={20} />
        <span>Admin Controls</span>
      </div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-md"
      >
        <Trash2 size={16} />
        {loading ? 'Deleting...' : 'Delete Offer'}
      </button>
    </div>
  );
}
