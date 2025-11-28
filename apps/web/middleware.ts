import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Detect prefetch requests (browser sends 'sec-purpose: prefetch' header)
  const isPrefetch = request.headers.get('x-middleware-prefetch') === '1' ||
                     request.headers.get('purpose') === 'prefetch' ||
                     request.headers.get('sec-purpose') === 'prefetch' ||
                     request.headers.get('sec-purpose')?.includes('prefetch') ||
                     request.nextUrl.searchParams.has('_nextData');
  
  // If it's a prefetch request, return early with 200 and no content
  // This prevents 503 errors from failed prefetch attempts
  if (isPrefetch) {
    const response = new NextResponse(null, { status: 200 });
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }
  
  // For non-prefetch requests, create response and add anti-prefetch headers
  const response = NextResponse.next();
  
  // Add headers to prevent prefetching and aggressive caching
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Protect dashboard routes - require merchantId in URL or cookie
  if (pathname.startsWith('/dashboard')) {
    const merchantId = request.nextUrl.searchParams.get('merchantId');
    const merchantIdCookie = request.cookies.get('merchantId')?.value;

    // Allow access to /dashboard (root) without merchantId - it will show login form
    if (pathname === '/dashboard') {
      // If merchantId is in URL, set it as a cookie for future requests
      if (merchantId && !merchantIdCookie) {
        const response = NextResponse.next();
        response.cookies.set('merchantId', merchantId, {
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
        return response;
      }
      // Allow access to /dashboard to show login form
      return NextResponse.next();
    }

    // For sub-routes (like /dashboard/contents, /dashboard/settings), require merchantId
    if (!merchantId && !merchantIdCookie) {
      // Redirect to dashboard login page
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If merchantId is in URL, set it as a cookie for future requests
    if (merchantId && !merchantIdCookie) {
      const response = NextResponse.next();
      response.cookies.set('merchantId', merchantId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }
  }

  return NextResponse.next();
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

