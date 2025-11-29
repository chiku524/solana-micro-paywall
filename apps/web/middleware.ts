import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Detect prefetch requests more accurately
  // Priority: Always allow navigation requests through, even if they have prefetch headers
  const purpose = request.headers.get('purpose');
  const secPurpose = request.headers.get('sec-purpose');
  const secFetchMode = request.headers.get('sec-fetch-mode');
  const secFetchDest = request.headers.get('sec-fetch-dest');
  
  // If it's a navigation request (user clicked a link), always allow it through
  // This ensures actual clicks/navigation work properly
  const isNavigation = secFetchMode === 'navigate' || secFetchDest === 'document';
  
  // Only treat as prefetch if:
  // 1. It's NOT a navigation request AND
  // 2. It has prefetch purpose headers
  // This ensures actual clicks/navigation go through properly
  const isPrefetch = !isNavigation && 
                     (purpose === 'prefetch' || secPurpose === 'prefetch' || secPurpose?.includes('prefetch'));
  
  // If it's a prefetch request, return early with 200 and no content
  // This prevents 503 errors from failed prefetch attempts
  // But allow actual navigation requests to proceed normally
  if (isPrefetch) {
    const response = new NextResponse(null, { status: 200 });
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }
  
  // For non-prefetch requests, handle dashboard routes and add anti-prefetch headers
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
    response = NextResponse.next();
  }
  
  // Add headers to prevent prefetching and aggressive caching on all responses
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
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

