import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// Public paths that don't require authentication
const publicPaths = ["/", "/login", "/signup", "/api/auth"];

export async function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("__session");
  const { pathname } = request.nextUrl;

  // Check if path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for auth cookie
  if (!authCookie?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(authCookie.value);
    
    // Check if token is about to expire (within 5 minutes)
    const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    if (timeUntilExpiration < 5 * 60 * 1000) { // 5 minutes
      // Token is about to expire, refresh it
      const newToken = await getAuth().createCustomToken(decodedToken.uid);
      
      // Log token refresh for debugging
      console.log(`[Auth] Token refreshed for user ${decodedToken.uid}`);
      
      // Create response with new token
      const response = NextResponse.next();
      response.cookies.set("__session", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // Using 'lax' for better compatibility while maintaining security
        maxAge: 3600, // 1 hour
        path: "/",
      });
      
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    // Log the error for debugging
    console.error("[Auth] Token verification failed:", error);
    
    // Create response with error message
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("auth_error", "Session expired, please log in again", {
      httpOnly: false, // Allow client-side access for toast
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5, // 5 seconds
      path: "/",
    });
    
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}; 