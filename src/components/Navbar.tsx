'use client';

import Link from 'next/link';
import { ShoppingBag, Search, Menu, User, LogOut } from 'lucide-react';
import { useState } from 'react';
// import { signOut } from 'next-auth/react'; // We'll use a server action for signout to avoid client js issues

export default function Navbar({ session }: { session: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
                  V
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                  VTuber Marketplace
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
                <Link href="#" className="hover:text-gray-900 transition-colors">Marketplace</Link>
                <Link href="#" className="hover:text-gray-900 transition-colors">Creators</Link>
                <Link href="#" className="hover:text-gray-900 transition-colors">Commission</Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Search size={20} />
              </button>
              
              <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors hidden sm:block">
                Creator Dashboard
              </Link>

              {session ? (
                  <div className="relative group">
                      <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-600">
                          {session.user?.image ? (
                              <img src={session.user.image} className="w-8 h-8 rounded-full" />
                          ) : (
                              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                                  <User size={16} />
                              </div>
                          )}
                          <span className="hidden sm:block">{session.user?.name || session.user?.email}</span>
                      </button>
                      
                      {/* Dropdown */}
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                          <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Models</Link>
                          <Link href="/favorites" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Favorites</Link>
                          <div className="border-t border-gray-100 my-1"></div>
                          <Link href="/api/auth/signout" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                              <LogOut size={14} /> Sign Out
                          </Link>
                      </div>
                  </div>
              ) : (
                  <Link href="/login" className="text-sm font-bold text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                      Login
                  </Link>
              )}

              <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors relative">
                <ShoppingBag size={20} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              </button>
              <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>
  );
}
