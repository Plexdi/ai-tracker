'use client';

import React, { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/zustandStore';
import { deleteCookie } from 'cookies-next';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface ModernLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function ModernLayout({ children, title, description }: ModernLayoutProps) {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      // Sign out logic
      await signOut(auth);
      
      // Clear auth cookie
      deleteCookie('auth-state');
      
      // Clear user state
      setCurrentUser(null);
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ) },
    { name: 'Progress', href: '/progress', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ) },
    { name: 'Plans', href: '/plan', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ) },
    { name: 'Splits', href: '/splits', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    ) },
    { name: 'AI Assistant', href: '/ai', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ) },
    { name: 'Log Lift', href: '/log-lift', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ) },
    { name: 'Exercises', href: '/exercises', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 border-r border-slate-800/50 bg-slate-950/70 backdrop-blur-sm">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 mb-5">
                <span className="text-xl font-bold text-white">AI Tracker</span>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all duration-150"
                  >
                    <div className="mr-3 text-slate-400 group-hover:text-slate-300">
                      {item.icon}
                    </div>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-slate-800/50 p-4">
              <Link href="/profile" className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div className="inline-block h-9 w-9 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                    {currentUser?.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || "User"} 
                        className="h-9 w-9 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.style.display = 'none';
                          // Parent element will show the fallback letter
                        }}
                      />
                    ) : (
                      currentUser?.displayName?.charAt(0) || "U"
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{currentUser?.displayName || "User"}</p>
                    <p className="text-xs text-slate-400 group-hover:text-slate-300">View profile</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-slate-950 border-b border-slate-800/50">
            <button
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-300 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              ></div>
              <div className="fixed inset-y-0 left-0 w-64 bg-slate-950/95 border-r border-slate-800/50 z-50 md:hidden transform transition-transform ease-in-out duration-300">
                <div className="flex flex-col h-full pt-5">
                  <div className="flex items-center justify-between px-4 mb-5">
                    <span className="text-xl font-bold text-white">AI Tracker</span>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 rounded-md text-slate-400 hover:text-white"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all duration-150"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="mr-3 text-slate-400 group-hover:text-slate-300">
                          {item.icon}
                        </div>
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  <div className="flex-shrink-0 flex border-t border-slate-800/50 p-4">
                    <Link href="/profile" className="flex-shrink-0 w-full group block" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="flex items-center">
                        <div className="inline-block h-9 w-9 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                          {currentUser?.photoURL ? (
                            <img 
                              src={currentUser.photoURL} 
                              alt={currentUser.displayName || "User"} 
                              className="h-9 w-9 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.style.display = 'none';
                                // Parent element will show the fallback letter
                              }}
                            />
                          ) : (
                            currentUser?.displayName?.charAt(0) || "U"
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white">{currentUser?.displayName || "User"}</p>
                          <p className="text-xs text-slate-400 group-hover:text-slate-300">View profile</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm flex-shrink-0 flex h-16 border-b border-slate-800/50">
            <div className="flex-1 px-4 flex justify-between">
              <div className="flex-1 flex items-center">
                <h1 className="text-2xl font-semibold text-white">{title}</h1>
                {description && (
                  <p className="ml-4 text-sm text-slate-400">{description}</p>
                )}
              </div>
              <div className="ml-4 flex items-center md:ml-6">
                <button
                  onClick={handleSignOut}
                  className="p-1 rounded-full text-slate-400 hover:text-white focus:outline-none"
                >
                  <span className="sr-only">Sign out</span>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 