import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip middleware for prefetch requests to prevent 503 errors
  // Prefetch requests have 'x-middleware-prefetch' header or are from Next.js router
  const isPrefetch = request.headers.get('x-middleware-prefetch') === '1' ||
                     request.headers.get('purpose') === 'prefetch' ||
                     request.nextUrl.searchParams.has('_nextData');
  
  if (isPrefetch) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

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

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};

