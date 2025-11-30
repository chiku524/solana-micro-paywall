import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // CRITICAL: Always wrap middleware in try-catch to prevent 503 errors
  // If middleware throws, Next.js returns 503, which gets cached
  try {
    // Detect prefetch requests more accurately
    // Priority: Always allow navigation requests through, even if they have prefetch headers
    const purpose = request.headers.get('purpose');
    const secPurpose = request.headers.get('sec-purpose');
    const secFetchMode = request.headers.get('sec-fetch-mode');
    const secFetchDest = request.headers.get('sec-fetch-dest');
    
    // CRITICAL: If it's a navigation request (user clicked a link), ALWAYS allow it through
    // This is the most important check - navigation requests must never be blocked
    // Note: Some browsers send both sec-fetch-mode: navigate AND sec-purpose: prefetch
    // In this case, we MUST prioritize navigation mode to ensure clicks work
    const isNavigation = secFetchMode === 'navigate' || secFetchDest === 'document';
    
    // CRITICAL: Only treat as prefetch if it's NOT a navigation request
    // Navigation requests with prefetch headers are still navigation requests!
    const isPrefetch = !isNavigation && 
                       (purpose === 'prefetch' || secPurpose === 'prefetch' || secPurpose?.includes('prefetch'));
    
    // If it's a navigation request with prefetch headers (browser speculative prefetch),
    // we still let it through - it's a navigation request, not a prefetch
    const isNavigationWithPrefetch = isNavigation && (purpose === 'prefetch' || secPurpose === 'prefetch' || secPurpose?.includes('prefetch'));
    
    // CRITICAL: Only block pure prefetch requests (not navigation)
    // Navigation requests MUST always pass through, even if they have prefetch headers
    if (isPrefetch) {
      // This is a pure prefetch request (not navigation) - return empty 200
      const response = new NextResponse(null, { status: 200 });
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      response.headers.set('X-Request-Type', 'prefetch-blocked');
      // Add Vary header to prevent browsers from using prefetch cache for navigation
      response.headers.set('Vary', 'sec-fetch-mode, sec-purpose, sec-fetch-dest');
      return response;
    }
    
    // If we get here, it's either:
    // 1. A navigation request (with or without prefetch headers) - MUST let through
    // 2. A regular request without prefetch headers - let through
    // NEVER block navigation requests!
  
  // For navigation requests with prefetch headers, DON'T redirect
  // Instead, let them through but set aggressive cache headers
  // Redirecting breaks Next.js client-side routing and causes redirect loops
  // The cache headers will prevent browsers from using prefetch cache
  
    // For all non-prefetch requests (including navigation), handle routes and add headers
    let response: NextResponse;
    
    // Protect dashboard routes - require merchantId in URL or cookie
    if (pathname.startsWith('/dashboard')) {
      const merchantId = request.nextUrl.searchParams.get('merchantId');
      const merchantIdCookie = request.cookies.get('merchantId')?.value;

      // Allow access to /dashboard (root) without merchantId - it will show login form
      if (pathname === '/dashboard') {
        // If merchantId is in URL, set it as a cookie for future requests
        if (merchantId && !merchantIdCookie) {
          response = NextResponse.next();
          response.cookies.set('merchantId', merchantId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
        } else {
          response = NextResponse.next();
        }
      } else {
        // For sub-routes (like /dashboard/contents, /dashboard/settings), require merchantId
        if (!merchantId && !merchantIdCookie) {
          // Redirect to dashboard login page
          response = NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
          // If merchantId is in URL, set it as a cookie for future requests
          response = NextResponse.next();
          if (merchantId && !merchantIdCookie) {
            response.cookies.set('merchantId', merchantId, {
              path: '/',
              maxAge: 60 * 60 * 24 * 30, // 30 days
            });
          }
        }
      }
    } else {
      // For all other routes (marketplace, docs, etc.), always let through
      response = NextResponse.next();
    }
    
    // Add headers to prevent prefetching and aggressive caching on all responses
    // For navigation requests (especially those with prefetch headers), be extra aggressive
    if (isNavigationWithPrefetch) {
      // Navigation request with prefetch headers - force bypass of prefetch cache
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0, no-transform, immutable');
      response.headers.set('X-Request-Type', 'navigation-bypass-prefetch');
    } else {
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
    }
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    // Add Vary header to ensure browsers don't use prefetch cache for navigation requests
    // This is critical: browsers must treat prefetch and navigation requests as different
    response.headers.set('Vary', 'sec-fetch-mode, sec-purpose, sec-fetch-dest, purpose');
    
    // For all navigation requests, add additional headers to prevent using prefetch cache
    if (isNavigation) {
      // Add a unique header to ensure this response is not confused with prefetch responses
      response.headers.set('X-Request-Type', 'navigation');
    }
    
    return response;
  } catch (error) {
    // CRITICAL: If middleware throws, return a proper response instead of letting it fail
    // This prevents Next.js from returning 503, which gets cached by browsers
    console.error('[Middleware] Error in middleware:', error);
    const errorResponse = NextResponse.next();
    errorResponse.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
    errorResponse.headers.set('Pragma', 'no-cache');
    errorResponse.headers.set('Expires', '0');
    return errorResponse;
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

