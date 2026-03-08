
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { ArrowLeft, Save, FileText } from 'lucide-react';

export default function ContentEditorPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Predefined pages we want to manage
  const availablePages = [
    { slug: 'terms', label: 'Terms of Service' },
    { slug: 'privacy', label: 'Privacy Policy' },
    { slug: 'refund-policy', label: 'Refund Policy' },
    { slug: 'seller-agreement', label: 'Seller Agreement' },
    { slug: 'cookies-policy', label: 'Cookies Policy' },
    { slug: 'help', label: 'Help Center' },
    { slug: 'contact', label: 'Contact Us' },
  ];

  useEffect(() => {
    fetchPage(selectedSlug || 'terms');
  }, [selectedSlug]);

  const fetchPage = async (slug: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/content?slug=${slug}`);
      if (response.data) {
        setTitle(response.data.title || availablePages.find(p => p.slug === slug)?.label || '');
        setContent(response.data.content || '');
      }
    } catch (error) {
      console.error('Failed to fetch page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/admin/content', {
        slug: selectedSlug || 'terms',
        title,
        content
      });
      setMessage('Page saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save page:', error);
      alert('Failed to save page content.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <FileText className="text-blue-400" /> Content Manager
            </h1>
            <div className="flex gap-2">
                {availablePages.map(page => (
                    <button
                        key={page.slug}
                        onClick={() => setSelectedSlug(page.slug)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            (selectedSlug || 'terms') === page.slug
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                    >
                        {page.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-400 mb-2">Page Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Terms of Service"
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-400 mb-2">Content (HTML or Markdown)</label>
                <div className="text-xs text-gray-500 mb-2">
                    Tip: You can use standard HTML tags like &lt;h1&gt;, &lt;p&gt;, &lt;ul&gt; for formatting.
                </div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-4 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[500px]"
                    placeholder="<h1>Welcome</h1><p>Enter your page content here...</p>"
                />
            </div>

            <div className="flex justify-end items-center gap-4">
                {message && (
                    <span className="text-green-400 text-sm font-medium animate-pulse">
                        {message}
                    </span>
                )}
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}
