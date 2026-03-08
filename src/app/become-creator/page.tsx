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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Seller / Studio Name</label>
                            <input 
                                type="text"
                                name="sellerName" 
                                required 
                                className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="Your brand name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contact Email or Discord</label>
                            <input 
                                type="text"
                                name="contactInfo" 
                                required 
                                className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="email@example.com or user#1234"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Portfolio Links</label>
                        <p className="text-xs text-gray-500 mb-2">
                            1-3 links max (e.g. X, YouTube, Portfolio Site, VGen).
                        </p>
                        <textarea 
                            name="portfolio" 
                            required 
                            rows={3}
                            placeholder="https://twitter.com/my_art&#10;https://vgen.co/my_profile"
                            className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Best Work Samples</label>
                        <p className="text-xs text-gray-500 mb-2">
                            3-5 examples. For each: Preview Link + Short Note (Art/Rig/Full).
                        </p>
                        <textarea 
                            name="workSamples" 
                            required 
                            rows={5}
                            placeholder="1. https://link-to-image.com - Full Model (Art+Rig)&#10;2. https://youtube.com/video - Rig Only"
                            className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">What do you plan to sell?</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['Full Model', 'Rigged Model', 'Art-only', 'Chibi', 'Full Body', 'Adoptable / Premade'].map((type) => (
                                <div key={type} className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        name="modelTypes" 
                                        value={type} 
                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-600">{type}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Style / Niche</label>
                            <input 
                                type="text"
                                name="style" 
                                required 
                                className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="Anime, dark, fantasy, furry..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Price Range</label>
                            <select name="priceRange" className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                                <option value="Under $100">Under $100</option>
                                <option value="$100 - $500">$100 - $500</option>
                                <option value="$500 - $1000">$500 - $1000</option>
                                <option value="$1000+">$1000+</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Short Intro</label>
                        <p className="text-xs text-gray-500 mb-2">
                            Tell us briefly about your work and what you want to sell.
                        </p>
                        <textarea 
                            name="intro" 
                            required 
                            minLength={10}
                            rows={3}
                            className="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        ></textarea>
                    </div>

                    <div>
                        <div className="flex items-start gap-2">
                            <input 
                                type="checkbox" 
                                id="seller-agreement" 
                                required 
                                className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                            />
                            <label htmlFor="seller-agreement" className="text-sm text-gray-600">
                                I agree to the <Link href="/seller-agreement" className="text-purple-600 hover:underline" target="_blank">Seller Agreement</Link> and <Link href="/terms" className="text-purple-600 hover:underline" target="_blank">Terms of Service</Link>.
                            </label>
                        </div>
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
