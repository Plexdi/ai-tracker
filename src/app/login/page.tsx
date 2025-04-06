'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useStore } from '../../lib/zustandStore';
import Login from '../../components/Login';
import { setCookie } from 'cookies-next';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This ensures the auth state is properly checked
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || undefined,
        });
        
        // Set auth cookie for middleware
        setCookie('auth-state', 'authenticated', { maxAge: 60 * 60 * 24 * 30 });
        
        router.push('/dashboard');
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, setCurrentUser]);

  // Show spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto pt-16 pb-8 px-4">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Welcome back
        </h1>
        <Login />
      </div>
    </div>
  );
} 