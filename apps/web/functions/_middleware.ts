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
  BUILD_ID?: string;
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
  const debugMode = url.searchParams.has('__debug');

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
  
  // #region agent log (disabled in production to avoid deployment issues)
  // Only log in development - fetch to localhost causes issues in Cloudflare deployment
  if (env.NODE_ENV === 'development') {
    fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_middleware.ts:46',message:'HTML response received',data:{pathname:url.pathname,htmlLength:html.length,hasDoctype:html.includes('<!DOCTYPE'),hasNextData:html.includes('__NEXT_DATA__'),hasRscMarkers:html.includes('<!--$'),hasNextRoot:html.includes('id="__next"'),hasDashboardDiv:html.includes('data-page="dashboard"'),hasDashboardClient:html.includes('DashboardPageClient'),first500Chars:html.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  
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
  // MUST be the very first thing in the HTML - no whitespace before it
  let modifiedHtml = html;
  // #region agent log (disabled in production)
  const hadDoctypeBefore = modifiedHtml.trim().startsWith('<!DOCTYPE');
  if (env.NODE_ENV === 'development') {
    fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_middleware.ts:61',message:'Before DOCTYPE check',data:{pathname:url.pathname,hadDoctype:hadDoctypeBefore,htmlStart:modifiedHtml.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }
  // #endregion
  
  // Ensure DOCTYPE exists (but avoid rewriting the rest of the document).
  // NOTE: Avoid trimming/rewriting App Router HTML streams; it can trigger hydration mismatches.
  // Check if DOCTYPE is missing (accounting for any leading whitespace/comments)
  const trimmedStart = modifiedHtml.trimStart();
  if (!trimmedStart.startsWith('<!DOCTYPE')) {
    console.log('[Middleware] CRITICAL: DOCTYPE missing! Adding it...');
    // CRITICAL: DOCTYPE must be first with no whitespace before it
    // Remove any leading whitespace/comments and prepend DOCTYPE
    modifiedHtml = '<!DOCTYPE html>' + trimmedStart;
    // #region agent log (disabled in production)
    if (env.NODE_ENV === 'development') {
      fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_middleware.ts:73',message:'DOCTYPE injected',data:{pathname:url.pathname,htmlStartAfter:modifiedHtml.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }
    // #endregion
  }
  // IMPORTANT: Do NOT rewrite RSC markers / body structure.
  // We have runtime evidence that the RSC marker replacement is producing a hidden
  // `<div data-rsc-placeholder="true">` in production, and React is throwing hydration error #418.
  
  // CRITICAL: Always ensure __NEXT_DATA__ exists with correct values
  // @cloudflare/next-on-pages doesn't inject it properly, or injects it with undefined values
  // We need to either inject it or replace existing one with correct values
  const buildId = env.BUILD_ID || 'development';
  const correctNextData = {
    props: {
      pageProps: {},
      __NEXT_ROUTER_BASEPATH: '',
      __NEXT_ROUTER_STATE_TREE: [url.pathname, { pathname: url.pathname, query: {}, asPath: url.pathname }, null, null, true, null, null, false],
    },
    page: url.pathname,
    pathname: url.pathname,
    query: {},
    buildId: buildId,
    isFallback: false,
    gssp: true,
    customServer: false,
    appGip: false,
    scriptLoader: [],
  };
  
  const nextDataScript = `<script id="__NEXT_DATA__" type="application/json" data-nextjs-data="">${JSON.stringify(correctNextData)}</script>`;
  
  // Check if __NEXT_DATA__ already exists
  const nextDataRegex = /<script[^>]*id="__NEXT_DATA__"[^>]*>[\s\S]*?<\/script>/i;
  const existingNextDataMatch = modifiedHtml.match(nextDataRegex);
  
  if (existingNextDataMatch) {
    // Log what we found before replacement
    const existingContent = existingNextDataMatch[0];
    console.log('[Middleware] Found existing __NEXT_DATA__:', existingContent.substring(0, 200));
    
    // Try to parse existing JSON to see what values it has
    try {
      const jsonMatch = existingContent.match(/>([\s\S]*?)<\/script>/);
      if (jsonMatch) {
        const existingData = JSON.parse(jsonMatch[1]);
        console.log('[Middleware] Existing __NEXT_DATA__ values:', {
          page: existingData.page,
          pathname: existingData.pathname,
          hasProps: !!existingData.props,
        });
      }
    } catch (e) {
      console.log('[Middleware] Could not parse existing __NEXT_DATA__ JSON');
    }
    
    // Replace existing __NEXT_DATA__ with correct values
    modifiedHtml = modifiedHtml.replace(nextDataRegex, nextDataScript);
    console.log('[Middleware] Replaced existing __NEXT_DATA__ with correct values for path:', url.pathname);
    console.log('[Middleware] New __NEXT_DATA__ script:', nextDataScript.substring(0, 200));
  } else {
    // Inject __NEXT_DATA__ if missing
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${nextDataScript}</head>`);
    } else if (modifiedHtml.includes('<body')) {
      // If no </head>, insert right after <body>
      modifiedHtml = modifiedHtml.replace(/<body[^>]*>/, `$&${nextDataScript}`);
    } else {
      // Last resort: prepend to HTML
      modifiedHtml = `${nextDataScript}${modifiedHtml}`;
    }
    console.log('[Middleware] Injected __NEXT_DATA__ for path:', url.pathname);
  }
  
  // Verify replacement worked
  const verifyMatch = modifiedHtml.match(nextDataRegex);
  if (verifyMatch) {
    try {
      const jsonMatch = verifyMatch[0].match(/>([\s\S]*?)<\/script>/);
      if (jsonMatch) {
        const verifyData = JSON.parse(jsonMatch[1]);
        console.log('[Middleware] VERIFIED __NEXT_DATA__ after replacement:', {
          page: verifyData.page,
          pathname: verifyData.pathname,
          matchesExpected: verifyData.page === url.pathname && verifyData.pathname === url.pathname,
        });
      }
    } catch (e) {
      console.error('[Middleware] Could not verify __NEXT_DATA__ replacement');
    }
  }
  
  // Create new response with modified HTML
  // #region agent log (disabled in production)
  if (env.NODE_ENV === 'development') {
    fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_middleware.ts:189',message:'Final HTML before response',data:{pathname:url.pathname,htmlLength:modifiedHtml.length,hasDoctype:modifiedHtml.trim().startsWith('<!DOCTYPE'),hasNextData:modifiedHtml.includes('__NEXT_DATA__'),hasNextRoot:modifiedHtml.includes('id="__next"'),hasDashboardContent:modifiedHtml.includes('data-page="dashboard"'),bodyContentLength:modifiedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion

  // If requested, inline lightweight debug info into the HTML so we can diagnose via curl without a browser.
  // We avoid relying on custom headers because some platforms/proxies may strip non-standard headers.
  if (debugMode) {
    const bodyLen = modifiedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]?.length ?? 0;
    const mwDebug = {
      path: url.pathname,
      hasDoctype: modifiedHtml.trim().startsWith('<!DOCTYPE'),
      hasNextData: modifiedHtml.includes('__NEXT_DATA__'),
      hasNextRoot: modifiedHtml.includes('id="__next"'),
      bodyLen,
      rscMarkerCount: (modifiedHtml.match(/<!--\$/g) || []).length,
      hasDashboardMarker: modifiedHtml.includes('data-page="dashboard"') || modifiedHtml.includes('id="dashboard-root"'),
    };

    const marker = `<!--MWDEBUG:${JSON.stringify(mwDebug)}-->`;
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${marker}</head>`);
    } else {
      modifiedHtml = `${marker}${modifiedHtml}`;
    }
  }

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