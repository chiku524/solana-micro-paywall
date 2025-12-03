import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: Middleware always runs on Edge runtime in Next.js 14+
// No need to export runtime - it's automatic for middleware
export function middleware(request: NextRequest) {
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
}

// Match all routes to add anti-prefetch headers globally
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
