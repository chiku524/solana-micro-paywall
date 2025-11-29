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

    // Intercept ALL link clicks to force hard navigation that bypasses browser cache
    // This is necessary because browsers cache prefetch 503 responses at a lower level
    // than middleware, so we need to intercept at the client level
    let handleLinkClick: ((e: MouseEvent) => void) | null = null;
    let handleError: ((event: ErrorEvent) => void) | null = null;
    
    if (typeof window !== 'undefined') {
      handleLinkClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a[href]') as HTMLAnchorElement;
        
        if (link && link.href) {
          try {
            const url = new URL(link.href);
            // Only handle internal links (same origin)
            if (url.origin === window.location.origin) {
              // Check if it's a Next.js Link component or internal link
              const isNextLink = link.hasAttribute('data-nextjs-link') || 
                                link.closest('[data-nextjs-scroll-focus-boundary]') !== null ||
                                link.getAttribute('href')?.startsWith('/');
              
              if (isNextLink) {
                // Prevent default Next.js navigation
                e.preventDefault();
                e.stopPropagation();
                
                // Force a hard navigation with cache-busting to bypass prefetch cache
                const targetPath = url.pathname + url.search + url.hash;
                
                // Always add fresh cache-busting parameter
                const separator = url.search ? '&' : '?';
                const finalUrl = `${targetPath}${separator}_nav=${Date.now()}`;
                
                // Use replace instead of href to avoid adding to history
                // This ensures browser makes a fresh request
                window.location.replace(finalUrl);
                return false;
              }
            }
          } catch (err) {
            // If URL parsing fails, let default behavior happen
            console.warn('[DisablePrefetch] Failed to parse URL:', err);
          }
        }
      };

      // Add click listener in capture phase to intercept before Next.js router
      document.addEventListener('click', handleLinkClick, true);
      
      // Also listen for navigation errors as fallback
      const handleNavigationError = () => {
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        
        if (url.searchParams.get('_retry') !== '1') {
          url.searchParams.set('_retry', '1');
          setTimeout(() => {
            window.location.href = url.toString();
          }, 100);
        }
      };

      handleError = (event: ErrorEvent) => {
        if (event.message?.includes('503') || event.message?.includes('Service Unavailable')) {
          console.log('[DisablePrefetch] Detected 503 error, attempting recovery...');
          handleNavigationError();
        }
      };

      window.addEventListener('error', handleError, true);
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
      // Remove event listeners
      if (typeof window !== 'undefined') {
        if (handleLinkClick) {
          document.removeEventListener('click', handleLinkClick, true);
        }
        if (handleError) {
          window.removeEventListener('error', handleError, true);
        }
      }
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}

