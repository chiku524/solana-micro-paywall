'use client';

import { useEffect } from 'react';

/**
 * Client-side wrapper to detect and log routing issues
 * This helps debug why landing page content appears on marketplace route
 */
export function MarketplaceClientWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Log when this component mounts - helps verify the correct component is rendering
    console.log('[Marketplace] Client component mounted at:', {
      pathname: window.location.pathname,
      href: window.location.href,
      timestamp: new Date().toISOString(),
    });
    
    // Check if we're seeing the wrong content
    const checkContent = () => {
      const hasLandingPageContent = document.querySelector('h1')?.textContent?.includes('Monetize Content');
      const hasMarketplaceContent = document.querySelector('h1')?.textContent?.includes('Discover Premium Content') ||
                                   document.querySelector('[href="/marketplace/discover"]') !== null;
      
      if (window.location.pathname === '/marketplace') {
        if (hasLandingPageContent && !hasMarketplaceContent) {
          console.error('[Marketplace] WRONG CONTENT DETECTED: Landing page content on marketplace route!', {
            pathname: window.location.pathname,
            hasLandingPageContent,
            hasMarketplaceContent,
            pageTitle: document.title,
            bodyContent: document.body.textContent?.substring(0, 200),
          });
        } else {
          console.log('[Marketplace] Correct content detected');
        }
      }
    };
    
    // Check after a short delay to allow React to render
    setTimeout(checkContent, 500);
  }, []);

  return <>{children}</>;
}

