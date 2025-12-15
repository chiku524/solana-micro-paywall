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

  // CRITICAL: Replace RSC streaming markers with empty div to allow hydration
  // The markers <!--$--><!--/$--> prevent React from hydrating the content
  // We'll replace them with a placeholder that React can hydrate
  let modifiedHtml = html.replace(/<!--\$--><!--\/\$-->/g, '<div data-rsc-placeholder="true"></div>');
  
  // Also check for other RSC streaming patterns
  modifiedHtml = modifiedHtml.replace(/<!--\$[^>]*-->/g, '');
  modifiedHtml = modifiedHtml.replace(/<!--\/\$[^>]*-->/g, '');

  // CRITICAL: Check if __NEXT_DATA__ exists in the HTML
  // If not, inject it in the <head> section (before </head>) for proper initialization
  if (!modifiedHtml.includes('__NEXT_DATA__')) {
    console.log('[Middleware] __NEXT_DATA__ missing, injecting for pathname:', url.pathname);
    
    const pathname = url.pathname;
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    // Create minimal __NEXT_DATA__ with proper structure for Next.js App Router
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
    
    // CRITICAL: Inject in <head> section (before </head>) for proper initialization
    // Next.js expects __NEXT_DATA__ to be in the head, not body
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${nextDataScript}</head>`);
    } else if (modifiedHtml.includes('</body>')) {
      // Fallback: inject before </body> if no </head> found
      modifiedHtml = modifiedHtml.replace('</body>', `${nextDataScript}</body>`);
    } else if (modifiedHtml.includes('</html>')) {
      modifiedHtml = modifiedHtml.replace('</html>', `${nextDataScript}</html>`);
    } else {
      // Last resort: append at the end
      modifiedHtml = modifiedHtml + nextDataScript;
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
    // CRITICAL: Disable Cloudflare Rocket Loader for Next.js
    // Rocket Loader interferes with Next.js script loading and causes MIME type errors
    newResponse.headers.set('CF-Rocket-Loader', 'off');
    
    console.log('[Middleware] Successfully injected __NEXT_DATA__ and removed RSC streaming markers');
    return newResponse;
  }

  // If __NEXT_DATA__ already exists, still remove RSC streaming markers and add security headers
  const newResponse = new Response(modifiedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('X-XSS-Protection', '1; mode=block');
  // CRITICAL: Disable Cloudflare Rocket Loader for Next.js
  // Rocket Loader interferes with Next.js script loading and causes MIME type errors
  newResponse.headers.set('CF-Rocket-Loader', 'off');

  return newResponse;
}
