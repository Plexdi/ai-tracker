'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '../lib/zustandStore';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/log-lift', label: 'Log Workout', icon: '💪' },
  { href: '/progress', label: 'Progress', icon: '📈' },
  { href: '/plan', label: 'Plan', icon: '📅' },
  { href: '/ai', label: 'AI Assistant', icon: '🤖' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (href: string) => {
    setIsMobileMenuOpen(false);
    router.push(href);
  };

  const NavLinks = () => (
    <nav className="flex-1">
      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.href}>
            <button
              onClick={() => handleNavigation(item.href)}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-lg opacity-75 mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  const UserProfile = () => (
    <div className="p-4 border-t border-gray-100 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        {currentUser?.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center">
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {currentUser?.displayName?.[0] || '?'}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
            {currentUser?.displayName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {currentUser?.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="text-sm">⇥</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - desktop */}
      <aside className="fixed left-0 top-0 bottom-0 hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">AI Fitness</h1>
        </div>
        <div className="flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="p-4">
            <NavLinks />
          </div>
          <UserProfile />
        </div>
      </aside>

      {/* Mobile header and menu */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">AI Fitness</h1>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="text-xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </header>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-10 bg-gray-800/50" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Mobile menu panel */}
        <div
          className={`fixed top-[57px] right-0 bottom-0 z-20 w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
              <NavLinks />
            </div>
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
} 