'use client';

import { useEffect } from 'react';

/**
 * Component to aggressively disable Next.js prefetching at the browser level.
 * This prevents 503 errors on Cloudflare Pages when routes are prefetched.
 * Also intercepts navigation clicks to bypass cached prefetch responses.
 */
export function DisablePrefetch() {
  useEffect(() => {
    const disable = () => {
      // Remove any existing prefetch/preload links
      document.querySelectorAll('link[rel="prefetch"], link[rel="preload"]').forEach((link) => {
        link.remove();
      });

      // Override Next.js router's prefetch method if available
      if (typeof window !== 'undefined') {
        // Try to access Next.js router through various possible paths
        const nextRouter = (window as any).next?.router || 
                          (window as any).__NEXT_DATA__?.router ||
                          (window as any).__NEXT_ROUTER_BASEPATH;
        
        if (nextRouter && typeof nextRouter.prefetch === 'function') {
          const originalPrefetch = nextRouter.prefetch;
          nextRouter.prefetch = async (href: string, as?: string, options?: any) => {
            console.log(`[DisablePrefetch] Blocking prefetch for: ${href}`);
            return Promise.resolve();
          };
        }

        // Also try to override through __NEXT_DATA__
        if ((window as any).__NEXT_DATA__) {
          const nextData = (window as any).__NEXT_DATA__;
          if (nextData.props?.pageProps?.__NEXT_ROUTER_BASEPATH) {
            // This is a different router instance, override it too
            const router = nextData.props.pageProps.__NEXT_ROUTER_BASEPATH;
            if (router && typeof router.prefetch === 'function') {
              router.prefetch = async () => Promise.resolve();
            }
          }
        }
      }
    };

    // Intercept navigation to detect and handle cached prefetch 503 responses
    if (typeof window !== 'undefined') {
      // Listen for navigation errors and retry with hard navigation
      const handleNavigationError = () => {
        // If we detect a 503 error during navigation, it might be from prefetch cache
        // We'll let the error boundary handle it, but we can also try a hard refresh
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        
        // If we're stuck on the same page after a navigation attempt, try a hard refresh
        // This will bypass any cached responses
        if (url.searchParams.get('_retry') !== '1') {
          url.searchParams.set('_retry', '1');
          // Small delay to avoid infinite loops
          setTimeout(() => {
            window.location.href = url.toString();
          }, 100);
        }
      };

      // Monitor for failed navigations
      window.addEventListener('error', (event) => {
        if (event.message?.includes('503') || event.message?.includes('Service Unavailable')) {
          console.log('[DisablePrefetch] Detected 503 error, attempting recovery...');
          handleNavigationError();
        }
      }, true);
    }

    // Run immediately
    disable();

    // Intercept link clicks to bypass prefetch cache
    document.addEventListener('click', handleLinkClick, true); // Use capture phase

    // Also observe DOM changes for dynamically added prefetch links
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'LINK') {
                const rel = element.getAttribute('rel');
                if (rel === 'prefetch' || rel === 'preload') {
                  console.log(`[DisablePrefetch] Removing ${rel} link: ${(node as HTMLLinkElement).href}`);
                  element.remove();
                }
              }
            }
          });
        }
      });
    });

    observer.observe(document.head, { childList: true, subtree: true });

    // Re-run disable periodically to catch any missed prefetch attempts
    const interval = setInterval(disable, 1000);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}

