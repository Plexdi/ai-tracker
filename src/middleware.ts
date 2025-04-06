import { NextRequest, NextResponse } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Use a cookie to track the auth state client-side instead of fully relying on Firebase
  // This helps with initial page loads before Firebase auth initializes
  const authCookie = request.cookies.get('auth-state');
  const url = request.nextUrl.clone();
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup';
  
  // If no auth cookie is set, let the client-side Firebase auth handle it
  if (!authCookie) {
    return NextResponse.next();
  }

  // If auth cookie exists and we're on auth page, redirect to dashboard
  if (authCookie.value === 'authenticated' && isAuthPage) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Next.js will handle the rest of the auth flow client-side
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/login', '/signup', '/dashboard/:path*', '/plan/:path*', '/progress/:path*', '/log-lift/:path*', '/ai/:path*'],
}; 