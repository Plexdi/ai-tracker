import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useStore } from '../lib/zustandStore';

interface LoginProps {
  isSignUp?: boolean;
}

export default function Login({ isSignUp = false }: LoginProps) {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useStore();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const user = {
          id: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || undefined,
        };
        setCurrentUser(user);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      // You could add a toast notification here for better UX
    }
  };

  // Don't render anything if user is already logged in
  if (currentUser) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 
            rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
            hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5 mr-2"
          />
          <span>Continue with Google</span>
        </button>
        {!isSignUp && (
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 hover:underline">
              Sign up
            </Link>
          </p>
        )}
      </div>
    </div>
  );
} 