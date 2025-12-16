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
  
  // DEBUG: Log HTML structure to understand what we're working with
  console.log('[Middleware] HTML response received for:', url.pathname);
  console.log('[Middleware] HTML length:', html.length);
  console.log('[Middleware] Contains DOCTYPE:', html.includes('<!DOCTYPE'));
  console.log('[Middleware] Contains __NEXT_DATA__:', html.includes('__NEXT_DATA__'));
  console.log('[Middleware] Contains RSC markers:', html.includes('<!--$'));
  console.log('[Middleware] Contains #__next:', html.includes('id="__next"'));
  console.log('[Middleware] Contains dashboard div:', html.includes('data-page="dashboard"'));
  console.log('[Middleware] Contains DashboardPageClient:', html.includes('DashboardPageClient'));
  
  // CRITICAL: Ensure DOCTYPE is present to prevent Quirks Mode
  // Cloudflare Pages might strip it, so we need to add it back
  let modifiedHtml = html;
  if (!modifiedHtml.trim().startsWith('<!DOCTYPE')) {
    console.log('[Middleware] CRITICAL: DOCTYPE missing! Adding it...');
    modifiedHtml = '<!DOCTYPE html>\n' + modifiedHtml;
  }
  
  // Log first 500 chars of body to see structure
  const bodyMatch = modifiedHtml.match(/<body[^>]*>([\s\S]{0,500})/);
  if (bodyMatch) {
    console.log('[Middleware] Body start:', bodyMatch[1].substring(0, 200));
  } else {
    console.log('[Middleware] WARNING: No <body> tag found in HTML!');
    console.log('[Middleware] HTML start:', modifiedHtml.substring(0, 300));
  }

  // CRITICAL: Replace RSC streaming markers with empty div to allow hydration
  // The markers <!--$--><!--/$--> prevent React from hydrating the content
  // We'll replace them with a placeholder that React can hydrate
  modifiedHtml = modifiedHtml.replace(/<!--\$--><!--\/\$-->/g, '<div data-rsc-placeholder="true"></div>');
  
  // Also check for other RSC streaming patterns
  modifiedHtml = modifiedHtml.replace(/<!--\$[^>]*-->/g, '');
  modifiedHtml = modifiedHtml.replace(/<!--\/\$[^>]*-->/g, '');
  
  // CRITICAL: If the body is empty or only has RSC markers, inject a placeholder
  // This happens when server components don't render on Cloudflare Pages
  const bodyContentMatch = modifiedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyContentMatch) {
    const bodyContent = bodyContentMatch[1];
    // Check if body only has minimal content (background, debuggers, etc.)
    const hasRealContent = bodyContent.includes('DashboardPageClient') || 
                          bodyContent.includes('data-page="dashboard"') ||
                          bodyContent.length > 1000; // Assume real content if body is substantial
    
    if (!hasRealContent && url.pathname === '/dashboard') {
      console.log('[Middleware] CRITICAL: Dashboard body content is empty or minimal!');
      console.log('[Middleware] Body content length:', bodyContent.length);
      console.log('[Middleware] Body content:', bodyContent.substring(0, 200));
      
      // Inject a placeholder div that the client component can mount into
      const placeholderDiv = '<div id="dashboard-root" data-page="dashboard"></div>';
      modifiedHtml = modifiedHtml.replace(
        /(<body[^>]*>)([\s\S]*?)(<\/body>)/i,
        `$1$2${placeholderDiv}$3`
      );
      console.log('[Middleware] Injected dashboard placeholder div');
    }
  }

  // CRITICAL: Ensure #__next root element exists in the HTML
  // Cloudflare Pages might strip it, so we need to ensure it's present
  // Next.js App Router requires this for React hydration
  if (!modifiedHtml.includes('id="__next"')) {
    console.log('[Middleware] CRITICAL: #__next root element missing! Ensuring it exists...');
    
    // Try to find the body tag and ensure #__next exists inside it
    // If body has content but no #__next, wrap it
    const bodyMatch = modifiedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const bodyContent = bodyMatch[1];
      // If body doesn't have #__next, wrap the content
      if (!bodyContent.includes('id="__next"')) {
        console.log('[Middleware] Wrapping body content in #__next div...');
        modifiedHtml = modifiedHtml.replace(
          /(<body[^>]*>)([\s\S]*?)(<\/body>)/i,
          `$1<div id="__next">$2</div>$3`
        );
        console.log('[Middleware] Successfully wrapped body content in #__next');
      }
    } else {
      // If no body tag found, this is a serious problem
      console.error('[Middleware] CRITICAL: No <body> tag found in HTML!');
    }
  } else {
    console.log('[Middleware] #__next root element found in HTML');
  }

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
    
    console.log('[Middleware] Successfully injected __NEXT_DATA__');
  } else {
    console.log('[Middleware] __NEXT_DATA__ already exists in HTML');
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
  
  console.log('[Middleware] Successfully processed HTML response');
  return newResponse;
}
