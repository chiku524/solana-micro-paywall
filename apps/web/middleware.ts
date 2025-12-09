import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// TEMPORARILY DISABLED: Testing if middleware is causing hydration issues
// Middleware runs on every request and can interfere with Next.js RSC streaming
// If disabling this fixes the issue, we'll need to optimize it to only run when necessary

export function middleware(request: NextRequest) {
  // TEMPORARILY: Just pass through everything without any processing
  // This will help us determine if middleware is the root cause
  return NextResponse.next();
  
  /* ORIGINAL CODE - DISABLED FOR TESTING
  const { pathname } = request.nextUrl;
  
  // CRITICAL: Minimize middleware to prevent any interference with Next.js rendering
  // Only handle essential auth logic, let Next.js handle everything else
  try {
    // Only handle dashboard auth - everything else passes through untouched
    if (pathname.startsWith('/dashboard')) {
      const merchantId = request.nextUrl.searchParams.get('merchantId');
      const merchantIdCookie = request.cookies.get('merchantId')?.value;

      if (pathname === '/dashboard') {
        // Root dashboard - always allow (shows login if no merchantId)
        const response = NextResponse.next();
        if (merchantId && !merchantIdCookie) {
          response.cookies.set('merchantId', merchantId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
          });
        }
        return response;
      } else {
        // Dashboard sub-routes - require merchantId
        if (!merchantId && !merchantIdCookie) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
          const response = NextResponse.next();
          if (merchantId && !merchantIdCookie) {
            response.cookies.set('merchantId', merchantId, {
              path: '/',
              maxAge: 60 * 60 * 24 * 30,
            });
          }
          return response;
        }
      }
    }
    
    // For all other routes, just pass through - let Next.js handle everything
    // This ensures proper DOCTYPE, HTML structure, and React hydration
    return NextResponse.next();
  } catch (error) {
    // If middleware throws, just let the request through
    // This prevents 503 errors from middleware failures
    console.error('[Middleware] Error:', error);
    return NextResponse.next();
  }
  */
}

// CRITICAL: Only match routes that actually need middleware
// For now, we're testing with minimal matching to see if middleware is the issue
export const config = {
  matcher: [
    // Only match dashboard routes for now - everything else bypasses middleware
    '/dashboard/:path*',
  ],
};
