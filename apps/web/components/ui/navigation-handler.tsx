'use client';

import { useEffect } from 'react';

/**
 * CRITICAL: Force full page reloads on navigation to prevent Quirks Mode
 * 
 * During client-side navigation, Next.js App Router streams RSC payloads.
 * On Cloudflare Pages, this can cause the DOCTYPE to be lost, resulting in Quirks Mode,
 * which breaks React hydration (error #418).
 * 
 * This component intercepts navigation and forces full page reloads to ensure
 * proper HTML structure (including DOCTYPE) is always present.
 */
export function NavigationHandler() {
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    // Check if we're in Quirks Mode
    if (document.compatMode === 'BackCompat') {
      console.error('[NavigationHandler] Quirks Mode detected! Forcing page reload.');
      // Force a full page reload to get proper DOCTYPE
      if (window.location.search.indexOf('_quirks_fix') === -1) {
        window.location.href = window.location.href + (window.location.search ? '&' : '?') + '_quirks_fix=1';
        return;
      }
    }
    
    // CRITICAL: Force full page reloads on ALL internal navigation
    // This is REQUIRED to prevent Quirks Mode on Cloudflare Pages
    // Next.js client-side navigation streams RSC payloads which can lose DOCTYPE
    // By forcing full page reloads, we ensure DOCTYPE is always present
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const url = new URL(link.href);
        // Only intercept internal navigation (same origin)
        if (url.origin === window.location.origin) {
          // Check if it's a Next.js Link (has href starting with /)
          const isInternalLink = link.getAttribute('href')?.startsWith('/');
          
          // Skip if explicitly marked to not reload
          if (isInternalLink && !link.hasAttribute('data-no-reload')) {
            // Prevent default Next.js navigation
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[NavigationHandler] Intercepting Link click to:', link.href, '- forcing full page reload to prevent Quirks Mode');
            // Force full page reload to ensure proper DOCTYPE and content
            // Use href (not replace) to allow browser back button to work
            // The full page reload ensures DOCTYPE is present and correct route content is loaded
            window.location.href = link.href;
          }
        }
      }
    };
    
    // Also intercept Next.js router navigation programmatically
    // This catches navigation via router.push(), router.replace(), etc.
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      console.log('[NavigationHandler] Intercepted history.pushState, forcing full page reload');
      // #region agent log
      const url = args[2] as string;
      fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'navigation-handler.tsx:66',message:'NavigationHandler pushState intercepted',data:{url:url,currentPath:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (url && url.startsWith('/')) {
        window.location.href = url;
        return;
      }
      return originalPushState.apply(history, args);
    };
    
    history.replaceState = function(...args) {
      const url = args[2] as string;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'navigation-handler.tsx:76',message:'NavigationHandler replaceState called',data:{url:url,currentPath:window.location.pathname,willIntercept:url && url.startsWith('/') && url !== window.location.pathname + window.location.search},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // CRITICAL: Don't intercept replaceState for same URL - this causes infinite reloads
      // Only intercept if navigating to a different route
      if (url && url.startsWith('/') && url !== window.location.pathname + window.location.search) {
        console.log('[NavigationHandler] Intercepted history.replaceState, forcing full page reload:', url);
        window.location.replace(url);
        return;
      }
      // Allow same-route navigation (e.g., adding query params) to proceed normally
      return originalReplaceState.apply(history, args);
    };
    
    // Add click listener to document
    document.addEventListener('click', handleLinkClick, true);
    
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      // Restore original history methods
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);
  
  return null;
}

