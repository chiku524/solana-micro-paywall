'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Debug component to log routing information and detect content mismatches
 */
export function RouteDebugger() {
  const pathname = usePathname();

  useEffect(() => {
    // Log route information
    console.log('[RouteDebugger] Current route:', {
      pathname,
      href: window.location.href,
      timestamp: new Date().toISOString(),
    });

    // Check what content is actually rendered
    setTimeout(() => {
      const h1 = document.querySelector('h1');
      const pageTitle = document.title;
      const hasLandingPageContent = h1?.textContent?.includes('Monetize Content with');
      const hasMarketplaceContent = h1?.textContent?.includes('Discover Premium Content');
      const hasDocsContent = h1?.textContent?.includes('Documentation');
      const hasDashboardContent = h1?.textContent?.includes('Dashboard') || document.querySelector('form') !== null;

      console.log('[RouteDebugger] Content check:', {
        pathname,
        pageTitle,
        h1Text: h1?.textContent,
        hasLandingPageContent,
        hasMarketplaceContent,
        hasDocsContent,
        hasDashboardContent,
        expectedContent: 
          pathname === '/' ? 'landing' :
          pathname.startsWith('/marketplace') ? 'marketplace' :
          pathname.startsWith('/docs') ? 'docs' :
          pathname.startsWith('/dashboard') ? 'dashboard' :
          'unknown',
        actualContent:
          hasLandingPageContent ? 'landing' :
          hasMarketplaceContent ? 'marketplace' :
          hasDocsContent ? 'docs' :
          hasDashboardContent ? 'dashboard' :
          'unknown',
        mismatch: (
          (pathname === '/' && !hasLandingPageContent) ||
          (pathname.startsWith('/marketplace') && !hasMarketplaceContent) ||
          (pathname.startsWith('/docs') && !hasDocsContent) ||
          (pathname.startsWith('/dashboard') && !hasDashboardContent)
        ),
      });

      // Check Next.js router state
      if ((window as any).__NEXT_DATA__) {
        console.log('[RouteDebugger] Next.js data:', {
          page: (window as any).__NEXT_DATA__.page,
          pathname: (window as any).__NEXT_DATA__.page,
          props: Object.keys((window as any).__NEXT_DATA__.props || {}),
        });
      }
    }, 1000);
  }, [pathname]);

  return null;
}

