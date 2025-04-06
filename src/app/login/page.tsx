'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useStore } from '../../lib/zustandStore';
import Login from '../../components/Login';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || undefined,
        });
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router, setCurrentUser]);

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