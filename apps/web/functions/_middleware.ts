/**
 * Workers + Pages Convergence Middleware
 * 
 * This Worker middleware runs before Pages serves content and can:
 * - Inject __NEXT_DATA__ script tag into HTML responses
 * - Handle API routing (delegates to backend workers)
 * - Modify HTML response
 * - Add security headers
 * 
 * This is the key to fixing the __NEXT_DATA__ injection issue.
 */

// Cloudflare Pages Functions types
// These are available at runtime in Cloudflare Pages, not during Next.js build
interface Env {
  DB: any; // D1Database - available at runtime
  CACHE: any; // KVNamespace - available at runtime
  NODE_ENV: string;
  FRONTEND_URL: string;
  CORS_ORIGIN: string;
}

// Cloudflare Pages Functions middleware signature
export async function onRequest(context: {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}): Promise<Response> {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Handle API routes - these should be handled by backend workers
  // For now, let Pages handle everything and we'll inject __NEXT_DATA__ for HTML responses
  // API routes will be handled separately via the backend-workers project
  
  // Let Pages handle the request first
  const response = await next();

  // Only modify HTML responses (not API responses, assets, etc.)
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Clone the response so we can modify it
  const html = await response.text();

  // CRITICAL: Check if __NEXT_DATA__ exists in the HTML
  // If not, inject it before the closing </body> tag
  if (!html.includes('__NEXT_DATA__')) {
    console.log('[Middleware] __NEXT_DATA__ missing, injecting for pathname:', url.pathname);
    
    const pathname = url.pathname;
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    // Create minimal __NEXT_DATA__ with proper structure
    const minimalNextData = {
      props: { 
        pageProps: {},
        __NEXT_ROUTER_BASEPATH: '',
        __NEXT_ROUTER_STATE_TREE: [pathname, { pathname, query: searchParams, asPath: url.pathname + url.search }, null, null, true, null, null, false],
      },
      page: pathname,
      pathname: pathname,
      query: searchParams,
      buildId: process.env.BUILD_ID || 'development',
      isFallback: false,
      gssp: true,
      customServer: false,
      appGip: false,
      locale: undefined,
      locales: undefined,
      defaultLocale: undefined,
      domainLocales: undefined,
      scriptLoader: [],
    };

    const nextDataScript = `<script id="__NEXT_DATA__" type="application/json" data-nextjs-data="">${JSON.stringify(minimalNextData)}</script>`;
    
    // Inject before closing </body> tag (or before closing </html> if no body)
    let modifiedHtml = html;
    if (html.includes('</body>')) {
      modifiedHtml = html.replace('</body>', `${nextDataScript}</body>`);
    } else if (html.includes('</html>')) {
      modifiedHtml = html.replace('</html>', `${nextDataScript}</html>`);
    } else {
      // Fallback: append at the end
      modifiedHtml = html + nextDataScript;
    }
    
    // Create new response with modified HTML
    const newResponse = new Response(modifiedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    // Add security headers
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'DENY');
    newResponse.headers.set('X-XSS-Protection', '1; mode=block');
    
    console.log('[Middleware] Successfully injected __NEXT_DATA__');
    return newResponse;
  }

  // If __NEXT_DATA__ already exists, just add security headers
  const newResponse = new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('X-XSS-Protection', '1; mode=block');

  return newResponse;
}
