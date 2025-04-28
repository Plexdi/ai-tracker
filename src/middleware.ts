import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Public paths that don't require authentication
const publicPaths = ["/", "/login", "/signup", "/api/auth"];

// Constants for token refresh
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const SESSION_COOKIE_NAME = "__session";
const ERROR_COOKIE_NAME = "auth_error";

// Get the JWT secret from environment variable
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

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
    // Verify the JWT token
    const { payload } = await jwtVerify(authCookie.value, JWT_SECRET);
    
    // Check if token is about to expire
    const expirationTime = payload.exp as number * 1000;
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    if (timeUntilExpiration < TOKEN_REFRESH_THRESHOLD) {
      // Token is about to expire, redirect to refresh endpoint
      const response = NextResponse.redirect(new URL("/api/auth/refresh", request.url));
      setSecureCookie(response, SESSION_COOKIE_NAME, authCookie.value, {
        maxAge: 3600, // 1 hour
      });
      return response;
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