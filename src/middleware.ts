import { NextRequest, NextResponse } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Use a cookie to track the auth state client-side instead of fully relying on Firebase
  // This helps with initial page loads before Firebase auth initializes
  const authCookie = request.cookies.get('auth-state');
  const url = request.nextUrl.clone();
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup';
  const isProtectedRoute = url.pathname.startsWith('/dashboard') || 
                          url.pathname.startsWith('/plan') || 
                          url.pathname.startsWith('/progress') || 
                          url.pathname.startsWith('/log-lift') || 
                          url.pathname.startsWith('/ai') ||
                          url.pathname.startsWith('/profile') ||
                          url.pathname.startsWith('/profile-card-demo') ||
                          url.pathname.startsWith('/horizontal-profile-demo');
  
  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (authCookie?.value === 'authenticated' && isAuthPage) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!authCookie?.value && isProtectedRoute) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Next.js will handle the rest of the auth flow client-side
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/plan/:path*',
    '/progress/:path*',
    '/log-lift/:path*',
    '/ai/:path*',
    '/profile/:path*',
    '/profile-card-demo/:path*',
    '/horizontal-profile-demo/:path*'
  ],
}; 