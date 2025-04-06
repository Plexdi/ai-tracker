'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useStore } from '../../lib/zustandStore';
import Login from '../../components/Login';

export default function SignupPage() {
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
          Create your account
        </h1>
        <Login isSignUp={true} />
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
} 