import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit, getClientIp } from './lib/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Login rate limiting: intercept POST /api/auth/callback/credentials
  if (
    pathname === '/api/auth/callback/credentials' &&
    request.method === 'POST'
  ) {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, 5, 60);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }
  }
  
  // Get token for authentication checks
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Admin route protection
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin')
  ) {
    if (!token) {
      // Redirect page requests to login, return 401 for API requests
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL));
    }
    
    if (token.role !== 'admin') {
      // 403 Forbidden for insufficient role
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL));
    }
  }
  
  // User dashboard route protection
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL));
    }
  }
  
  // Always-protected API routes (require token on ALL methods including GET)
  const alwaysProtectedRoutes = [
    '/api/favorites',
    '/api/messages',
    '/api/profile',
    '/api/settings',
    '/api/notifications',
  ];
  
  if (alwaysProtectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  // Public-read-protected-write API routes (GET is public, mutations require token)
  const publicReadRoutes = ['/api/properties', '/api/reviews'];
  
  if (publicReadRoutes.some((route) => pathname.startsWith(route))) {
    if (request.method !== 'GET' && !token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected page routes
    '/admin/:path*',
    '/dashboard/:path*',
    
    // Protected API routes
    '/api/admin/:path*',
    '/api/favorites/:path*',
    '/api/messages/:path*',
    '/api/profile/:path*',
    '/api/settings/:path*',
    '/api/notifications/:path*',
    '/api/properties/:path*',
    '/api/reviews/:path*',
    
    // Login rate limiting
    '/api/auth/callback/credentials',
  ],
};
