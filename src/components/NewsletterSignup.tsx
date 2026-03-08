'use client';

import { useActionState } from 'react';
import { subscribeToNewsletter } from '@/app/actions/newsletter';
import { Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const initialState = {
  message: '',
  success: false,
};

export default function NewsletterSignup() {
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <div className="bg-gray-900 dark:bg-black text-white rounded-2xl p-8 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-6 backdrop-blur-sm border border-white/20">
          <Mail className="w-6 h-6 text-purple-300" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Stay Updated
        </h2>
        <p className="text-gray-300 mb-8 text-lg">
          Subscribe to our newsletter for the latest Live2D models, creator tips, and exclusive deals.
        </p>

        <form action={formAction} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            name="email"
            placeholder="Enter your email address"
            required
            className="flex-grow px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30"
          >
            {isPending ? 'Subscribing...' : 'Subscribe'}
            {!isPending && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {state?.message && (
          <div className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${state.success ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
            {state.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {state.message}
          </div>
        )}
      </div>
    </div>
  );
}
