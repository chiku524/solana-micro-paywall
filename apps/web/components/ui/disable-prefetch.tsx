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

        // CRITICAL: Don't intercept fetch requests at all - it's causing hydration issues
        // and blocking Next.js RSC payload requests needed for client-side navigation
        // The prefetch blocking via link removal should be sufficient
        // If we need to block prefetches, we should do it more selectively
      }
    };

    // Monitor for navigation issues where browser uses cached 503 responses
    // If we detect wrong content is being shown, force a hard refresh
    if (typeof window !== 'undefined') {
      // Check if we're on the wrong page content-wise
      // This happens when server returns 503 and Next.js serves fallback content
      const checkPageContent = () => {
        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        
        // Skip check if we've already retried multiple times (avoid infinite loops)
        const retryCount = parseInt(urlParams.get('_retryCount') || '0', 10);
        if (retryCount >= 3) {
          console.warn(`[DisablePrefetch] Max retries reached for ${currentPath}, stopping detection`);
          return;
        }
        
        // Wait a bit for React to hydrate and render, then check content
        setTimeout(() => {
          // Check if we're seeing landing page content by looking for landing page specific elements
          const hasLandingPageHero = document.querySelector('h1')?.textContent?.includes('Monetize Content with');
          const hasLandingPageCTA = document.querySelector('[href="/dashboard"]')?.textContent?.includes('Start Selling');
          
          // Determine what content we should see based on the path
          const shouldSeeMarketplace = currentPath === '/marketplace' || currentPath.startsWith('/marketplace/');
          const shouldSeeDashboard = currentPath.startsWith('/dashboard');
          const shouldSeeLanding = currentPath === '/';
          
          // Check for marketplace-specific content
          const hasMarketplaceContent = document.querySelector('h1')?.textContent?.includes('Discover Premium Content') ||
                                       document.querySelector('[href="/marketplace/discover"]') !== null ||
                                       document.querySelector('header')?.textContent?.includes('Solana Paywall Marketplace');
          
          // Check for dashboard content
          const hasDashboardContent = document.querySelector('h1')?.textContent?.includes('Dashboard') ||
                                     document.querySelector('[class*="Merchant Dashboard"]') !== null ||
                                     document.querySelector('form') !== null; // Login form
          
          // Detect wrong content scenarios
          if (shouldSeeMarketplace && (hasLandingPageHero || hasLandingPageCTA) && !hasMarketplaceContent) {
            console.error(`[DisablePrefetch] WRONG CONTENT DETECTED: Landing page content on marketplace route!`, {
              pathname: currentPath,
              hasLandingPageHero,
              hasLandingPageCTA,
              hasMarketplaceContent,
              pageTitle: document.title,
            });
            // Force a hard navigation with cache-busting to get the correct content
            const cleanPath = currentPath;
            const newParams = new URLSearchParams();
            newParams.set('_nav', Date.now().toString());
            newParams.set('_retryCount', (retryCount + 1).toString());
            newParams.set('_force', 'true');
            const finalUrl = `${cleanPath}?${newParams.toString()}${window.location.hash}`;
            
            // Use replace to avoid history pollution
            window.location.replace(finalUrl);
            return;
          }
          
          if (shouldSeeDashboard && (hasLandingPageHero || hasLandingPageCTA) && !hasDashboardContent) {
            console.warn(`[DisablePrefetch] Detected wrong page content on ${currentPath}, forcing hard refresh...`);
            // Force a hard navigation with cache-busting
            const cleanPath = currentPath;
            const newParams = new URLSearchParams();
            newParams.set('_nav', Date.now().toString());
            newParams.set('_retryCount', (retryCount + 1).toString());
            const finalUrl = `${cleanPath}?${newParams.toString()}${window.location.hash}`;
            
            // Use replace to avoid history pollution
            window.location.replace(finalUrl);
            return;
          }
          
          // Log successful content detection for debugging
          if (shouldSeeMarketplace && hasMarketplaceContent) {
            console.log(`[DisablePrefetch] ✓ Correct marketplace content detected on ${currentPath}`);
          } else if (shouldSeeDashboard && hasDashboardContent) {
            console.log(`[DisablePrefetch] ✓ Correct dashboard content detected on ${currentPath}`);
          } else if (shouldSeeLanding && hasLandingPageHero) {
            console.log(`[DisablePrefetch] ✓ Correct landing page content detected on ${currentPath}`);
          }
        }, 2000); // Wait longer for React to hydrate and API calls to complete
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

    // Also observe DOM changes for dynamically added prefetch links and new anchor tags
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
    observer.observe(document.body, { childList: true, subtree: true });

    // Re-run disable periodically to catch any missed prefetch attempts
    const interval = setInterval(disable, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}

