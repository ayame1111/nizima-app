'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Loader2, Mail } from 'lucide-react';

export default function ReportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('bug');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Report sent:', { type, email, message });
    
    setLoading(false);
    setSent(true);
    
    setTimeout(() => {
        setSent(false);
        setIsOpen(false);
        setMessage('');
        setEmail('');
        setType('bug');
    }, 3000);
  };

  return (
    <>
        {/* Toggle Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`fixed bottom-6 right-6 z-[90] p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${isOpen ? 'bg-gray-200 text-gray-800 rotate-90' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
            title="Report an issue"
        >
            {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>

        {/* Form Container */}
        <div className={`fixed bottom-24 right-6 z-[90] w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'}`}>
            <div className="bg-purple-600 p-4 text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <Mail size={18} /> Contact Support
                </h3>
                <p className="text-xs text-purple-100 mt-1">Found a bug or have feedback?</p>
            </div>
            
            <div className="p-4">
                {sent ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Send size={32} />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Message Sent!</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Thanks for your feedback.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Issue Type</label>
                            <select 
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                            >
                                <option value="bug">Report a Bug</option>
                                <option value="feature">Feature Request</option>
                                <option value="account">Account Issue</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Your Email</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Message</label>
                            <textarea 
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                placeholder="Describe the issue..."
                                className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white resize-none"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-2 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send Report'}
                        </button>
                        
                        <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-2">
                            Emails are sent to <a href="mailto:contact@avataratelier.com" className="hover:underline text-purple-500">contact@avataratelier.com</a>
                        </p>
                    </form>
                )}
            </div>
        </div>
    </>
  );
}
