import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: Middleware always runs on Edge runtime in Next.js 14+
// No need to export runtime - it's automatic for middleware
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
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    
    // Enhanced prefetch detection:
    // 1. Check standard prefetch headers
    // 2. Check if request comes from Cloudflare's speculation service
    // 3. Check if it's a GET request without navigation intent
    const isNavigation = secFetchMode === 'navigate' || secFetchDest === 'document';
    const isCloudflareSpeculation = referer.includes('/cdn-cgi/speculation') || 
                                    userAgent.includes('Cloudflare') ||
                                    request.headers.get('cf-ray') !== null;
    const isPurePrefetch = !isNavigation && (
      purpose === 'prefetch' || 
      secPurpose === 'prefetch' ||
      (isCloudflareSpeculation && secFetchMode !== 'navigate')
    );
    
    // Block only pure prefetch requests (not navigation)
    if (isPurePrefetch) {
      // Return a proper HTML response for prefetch requests to prevent 503 errors
      // This ensures browsers don't cache a 503 response
      // Use a minimal HTML that won't cause issues if accidentally rendered
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Loading...</title></head><body></body></html>`;
      const response = new NextResponse(html, { 
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        }
      });
      // Aggressive no-cache headers to prevent any caching of prefetch responses
      response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      // Tell browsers not to use this response for navigation
      response.headers.set('X-Content-Type-Options', 'nosniff');
      // Add header to indicate this is a prefetch response
      response.headers.set('X-Prefetch-Response', 'true');
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
    
    // For navigation requests, ensure they bypass any cached prefetch responses
    // Add Vary header to ensure browsers don't use prefetch cache for navigation
    if (isNavigation) {
      response.headers.set('Vary', 'Sec-Fetch-Mode, Sec-Fetch-Dest, Purpose, Sec-Purpose');
      // Ensure navigation requests are fresh and not from prefetch cache
      response.headers.set('Cache-Control', 'no-cache, must-revalidate');
    } else {
      // Non-navigation requests get aggressive no-cache
      response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
    }
    
    // Add headers to prevent speculative prefetching
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    
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
