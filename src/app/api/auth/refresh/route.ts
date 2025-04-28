import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { SignJWT } from "jose";

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

export async function GET(request: Request) {
  try {
    const authCookie = request.headers.get("cookie")?.split("; ").find(row => row.startsWith("__session="))?.split("=")[1];
    
    if (!authCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Verify the current token with Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(authCookie);
    
    // Create a new JWT token using jose
    const newToken = await new SignJWT({ 
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    
    // Create response with new token
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("__session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("[Auth] Token refresh failed:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
} 