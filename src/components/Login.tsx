import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useStore } from '../lib/zustandStore';
import { toast } from 'react-hot-toast';
import { setCookie } from 'cookies-next';

interface LoginProps {
  isSignUp?: boolean;
  onSuccess?: () => void;
}

export default function Login({ isSignUp = false, onSuccess }: LoginProps) {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (currentUser?.id) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      
      const user = userCredential.user;
      
      // Set auth cookie for middleware
      setCookie('auth-state', 'authenticated', { maxAge: 60 * 60 * 24 * 30 }); // 30 days
      
      setCurrentUser({
        id: user.uid,
        email: user.email || 'Anonymous User',
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
        photoURL: user.photoURL || undefined,
      });

      onSuccess?.();
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error.message || 'Authentication failed';
      toast.error(errorMessage.includes('auth/') 
        ? errorMessage.split('auth/')[1].replace(/-/g, ' ').replace(')', '') 
        : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Set auth cookie for middleware
      setCookie('auth-state', 'authenticated', { maxAge: 60 * 60 * 24 * 30 }); // 30 days
      
      setCurrentUser({
        id: user.uid,
        email: user.email || 'Anonymous User',
        displayName: user.displayName || 'Anonymous User',
        photoURL: user.photoURL || undefined,
      });

      onSuccess?.();
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if user is already logged in
  if (currentUser?.id) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleEmailAuth} className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            id="email" 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
            id="password" 
            type="password" 
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between mb-6">
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
        
        <div className="flex items-center my-4">
          <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
          <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">OR</span>
          <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
        </div>
        
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </button>
        
        <div className="mt-6 text-center">
          {isSignUp ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-500 hover:text-blue-700">
                Sign In
              </Link>
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-blue-500 hover:text-blue-700">
                Sign Up
              </Link>
            </p>
          )}
        </div>
      </form>
    </div>
  );
} 