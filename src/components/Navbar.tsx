'use client';

import Link from 'next/link';
import { ShoppingBag, Search, Menu, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';

export default function Navbar({ session }: { session: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cart } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDarkPage = pathname?.startsWith('/admin');
  
  // Dynamic styles based on scroll state
  const textColorClass = isScrolled ? 'text-gray-900' : 'text-white';
  const logoTextGradient = isScrolled ? 'bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600' : 'text-white';
  const cartButtonClass = isScrolled ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20';
  const menuButtonClass = isScrolled ? 'text-gray-900' : 'text-white';

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-700 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-black border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center space-x-2 group">
                            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-blue-500/30 transition-all duration-700">
                                A
                            </div>
                            <span className={`text-xl font-bold transition-colors duration-700 ${logoTextGradient}`}>
                                Avatar Atelier
                            </span>
                        </Link>
              <div className={`hidden md:flex items-center gap-6 text-sm font-medium ${textColorClass}`}>
                <Link href="/" className="transition-colors duration-700 hover:opacity-80">Marketplace</Link>
                <Link href="/become-creator" className="transition-colors duration-700 hover:opacity-80">Become a Creator</Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
            {/* Admin Panel Link - Only for Admins */}
            {session?.user && (session.user as any).role === 'ADMIN' && (
                <Link href="/admin/users" className="text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors duration-700 hidden sm:block">
                  Admin Panel
                </Link>
            )}

            {/* Creator Dashboard Link - Only for Creators/Admins */}
              {session?.user && (['CREATOR', 'ADMIN'].includes((session.user as any).role)) && (
                  <Link href="/dashboard" className={`text-sm font-medium transition-colors duration-700 hidden sm:block ${textColorClass} hover:opacity-80`}>
                    Creator Dashboard
                  </Link>
              )}

              {session ? (
                  <div className="relative group">
                      <button className={`flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-colors duration-700 ${textColorClass}`}>
                          {session.user?.image ? (
                              <img src={session.user.image} className="w-8 h-8 rounded-full border-2 border-white/20 transition-all duration-700" />
                          ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-700 ${isScrolled ? 'bg-purple-100 text-purple-600' : 'bg-white/10 text-white border border-white/20'}`}>
                                  <User size={16} />
                              </div>
                          )}
                          <span className="hidden sm:block">{session.user?.name || session.user?.email}</span>
                      </button>
                      
                      {/* Dropdown */}
                      <div className="absolute right-0 top-full pt-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                          {/* Invisible bridge to prevent menu from closing when moving mouse */}
                          <div className="absolute -top-2 left-0 w-full h-2"></div>
                          <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                            <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Account</Link>
                            {/* <Link href="/favorites" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Favorites</Link> */}
                            <div className="border-t border-gray-100 my-1"></div>
                            <button 
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <LogOut size={14} /> Sign Out
                            </button>
                          </div>
                      </div>
                  </div>
              ) : (
                  <Link href="/login" className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors duration-700 ${isScrolled ? 'text-white bg-gray-900 hover:bg-gray-800' : 'text-gray-900 bg-white hover:bg-gray-100'}`}>
                      Login
                  </Link>
              )}

              <Link href="/cart" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-700 relative ${cartButtonClass}`}>
                <ShoppingBag size={20} />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {cart.length}
                    </span>
                )}
              </Link>
              <button className={`md:hidden p-2 transition-colors duration-700 ${menuButtonClass}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white">
                <div className="px-4 pt-2 pb-4 space-y-1">
                    <Link href="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md">Marketplace</Link>
                    <Link href="/become-creator" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md">Become a Creator</Link>
                    {/* Admin Link for Mobile */}
                {session?.user && (session.user as any).role === 'ADMIN' && (
                    <Link href="/admin/users" className="block px-3 py-2 text-base font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md">
                        Admin Panel
                    </Link>
                )}

                {session?.user && (['CREATOR', 'ADMIN'].includes((session.user as any).role)) && (
                        <Link href="/dashboard" className="block px-3 py-2 text-base font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md">
                            Creator Dashboard
                        </Link>
                    )}
                    {session ? (
                        <>
                            <div className="border-t border-gray-100 my-2"></div>
                            <Link href="/account" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md">My Account</Link>
                            <button 
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="w-full text-left block px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        )}
      </nav>
  );
}
