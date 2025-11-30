import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // CRITICAL: Simplify middleware to prevent 503 errors
  // The complex logic was causing issues - simplify to just handle dashboard auth and block pure prefetch
  try {
    // Get request headers for prefetch detection
    const secFetchMode = request.headers.get('sec-fetch-mode');
    const secFetchDest = request.headers.get('sec-fetch-dest');
    const purpose = request.headers.get('purpose');
    const secPurpose = request.headers.get('sec-purpose');
    
    // SIMPLIFIED: Only block if it's clearly a prefetch AND not a navigation request
    // Navigation requests (sec-fetch-mode: navigate or sec-fetch-dest: document) ALWAYS pass through
    const isNavigation = secFetchMode === 'navigate' || secFetchDest === 'document';
    const isPurePrefetch = !isNavigation && (purpose === 'prefetch' || secPurpose === 'prefetch');
    
    // Block only pure prefetch requests (not navigation)
    if (isPurePrefetch) {
      const response = new NextResponse(null, { status: 200 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }
    
    // For ALL other requests (navigation, regular requests), let them through
    let response: NextResponse;
    
    // Only handle dashboard auth - everything else passes through
    if (pathname.startsWith('/dashboard')) {
      const merchantId = request.nextUrl.searchParams.get('merchantId');
      const merchantIdCookie = request.cookies.get('merchantId')?.value;

      if (pathname === '/dashboard') {
        // Root dashboard - always allow (shows login if no merchantId)
        response = NextResponse.next();
        if (merchantId && !merchantIdCookie) {
          response.cookies.set('merchantId', merchantId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
          });
        }
      } else {
        // Dashboard sub-routes - require merchantId
        if (!merchantId && !merchantIdCookie) {
          response = NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
          response = NextResponse.next();
          if (merchantId && !merchantIdCookie) {
            response.cookies.set('merchantId', merchantId, {
              path: '/',
              maxAge: 60 * 60 * 24 * 30,
            });
          }
        }
      }
    } else {
      // All other routes - always let through
      response = NextResponse.next();
    }
    
    // Add cache headers to prevent aggressive caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
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
