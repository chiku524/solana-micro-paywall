'use client';

import { useEffect } from 'react';

/**
 * Component to aggressively disable Next.js prefetching at the browser level.
 * This prevents 503 errors on Cloudflare Pages when routes are prefetched.
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

    // Monitor for navigation issues where browser uses cached 503 responses
    // If we detect wrong content is being shown, force a hard refresh
    if (typeof window !== 'undefined') {
      // Check if we're on the wrong page content-wise
      // This happens when server returns 503 and Next.js serves fallback content
      const checkPageContent = () => {
        const currentPath = window.location.pathname;
        
        // If we're not on the landing page, check if we're seeing landing page content
        if (currentPath !== '/') {
          // Check if we're seeing landing page content by looking for landing page specific elements
          const hasLandingPageContent = document.querySelector('h1')?.textContent?.includes('Monetize Content') ||
                                       document.querySelector('[href="/marketplace"]') !== null;
          
          // If we're on a different path but seeing landing page content, it's a 503 fallback issue
          if (hasLandingPageContent && currentPath !== '/') {
            const urlParams = new URLSearchParams(window.location.search);
            // Only try once to avoid infinite loops
            if (!urlParams.has('_retried')) {
              console.warn(`[DisablePrefetch] Detected wrong page content on ${currentPath}, forcing hard refresh...`);
              // Force a hard navigation with cache-busting
              const separator = urlParams.toString() ? '&' : '?';
              const finalUrl = `${currentPath}${separator}_nav=${Date.now()}&_retried=1${window.location.hash}`;
              // Small delay to ensure page has loaded
              setTimeout(() => {
                window.location.replace(finalUrl);
              }, 100);
            }
          }
        }
      };
      
      // Run check after page loads
      if (document.readyState === 'complete') {
        setTimeout(checkPageContent, 1000);
      } else {
        window.addEventListener('load', () => {
          setTimeout(checkPageContent, 1000);
        });
      }
    }

    // Run immediately
    disable();

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
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}

