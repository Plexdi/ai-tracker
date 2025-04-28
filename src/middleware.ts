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

// Constants for token refresh
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const SESSION_COOKIE_NAME = "__session";
const ERROR_COOKIE_NAME = "auth_error";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(SESSION_COOKIE_NAME);

  // Check for auth cookie
  if (!authCookie?.value) {
    return handleAuthError(request, "Please log in to continue");
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(authCookie.value);
    
    // Check if token is about to expire
    const expirationTime = decodedToken.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    if (timeUntilExpiration < TOKEN_REFRESH_THRESHOLD) {
      try {
        // Token is about to expire, refresh it
        const newToken = await getAuth().createCustomToken(decodedToken.uid);
        
        // Log token refresh for debugging
        console.log(`[Auth] Token refreshed for user ${decodedToken.uid}`);
        
        // Create response with new token
        const response = NextResponse.next();
        setSecureCookie(response, SESSION_COOKIE_NAME, newToken, {
          maxAge: 3600, // 1 hour
        });
        
        return response;
      } catch (refreshError) {
        console.error("[Auth] Token refresh failed:", refreshError);
        return handleAuthError(request, "Session expired, please log in again");
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[Auth] Token verification failed:", error);
    return handleAuthError(request, "Session expired, please log in again");
  }
}

// Helper function to set secure cookies
function setSecureCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: { maxAge: number; httpOnly?: boolean } = { maxAge: 3600 }
) {
  response.cookies.set(name, value, {
    httpOnly: options.httpOnly ?? true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: options.maxAge,
    path: "/",
  });
}

// Helper function to handle authentication errors
function handleAuthError(request: NextRequest, message: string) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  setSecureCookie(response, ERROR_COOKIE_NAME, message, {
    maxAge: 5,
    httpOnly: false, // Allow client-side access for toast
  });
  return response;
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