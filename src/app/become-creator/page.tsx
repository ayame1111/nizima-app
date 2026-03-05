'use client';

import { useState, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { submitCreatorApplication } from '@/app/actions/creator';
import Navbar from '@/components/Navbar';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function BecomeCreatorPage() {
  const { data: session, status } = useSession();
  const [state, dispatch] = useFormState(submitCreatorApplication, undefined);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Become a Creator</h1>
            <p className="text-gray-600 text-lg">
                Join our marketplace and start selling your Live2D models to VTubers worldwide.
            </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-sm">
            {!session ? (
                <div className="text-center py-8">
                    <p className="mb-6 text-gray-600">You need to be logged in to apply.</p>
                    <Link href="/login" className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors">
                        Log In to Apply
                    </Link>
                </div>
            ) : state?.success ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        ✓
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Application Submitted!</h2>
                    <p className="text-gray-600 mb-6">
                        Thank you for applying. Our team will review your portfolio and get back to you shortly via email.
                    </p>
                    <Link href="/" className="text-purple-600 font-bold hover:underline">
                        Return Home
                    </Link>
                </div>
            ) : (
                <form action={dispatch} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Portfolio / Work Samples</label>
                        <p className="text-xs text-gray-500 mb-2">
                            Please provide links to your previous Live2D works (Twitter, YouTube, ArtStation, or Google Drive folder).
                        </p>
                        <textarea 
                            name="portfolio" 
                            required 
                            rows={4}
                            placeholder="https://twitter.com/my_art&#10;https://drive.google.com/..."
                            className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Experience Level</label>
                        <select name="experience" className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                            <option value="beginner">Beginner (0-1 years)</option>
                            <option value="intermediate">Intermediate (1-3 years)</option>
                            <option value="professional">Professional (3+ years)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Why do you want to join?</label>
                        <textarea 
                            name="motivation" 
                            required 
                            rows={3}
                            className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        ></textarea>
                    </div>

                    {state?.error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                            {state.error}
                        </div>
                    )}

                    <button type="submit" className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/10">
                        Submit Application
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
}
