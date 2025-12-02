'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Wrapper component that helps with route changes
 * Simplified to avoid causing unnecessary remounts that remove content
 */
export function RouteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Force a scroll to top on route change
    window.scrollTo(0, 0);
    
    // Only check for wrong content after a longer delay to ensure page has fully rendered
    // And only check if we're CERTAIN there's wrong content (very strict conditions)
    const checkContent = setTimeout(() => {
      if (typeof window === 'undefined') return;
      
      const currentPath = window.location.pathname;
      
      // Only check if we can clearly see landing page content when we shouldn't
      // Be very strict - only trigger if we're absolutely sure there's wrong content
      const landingPageElement = document.querySelector('[data-page="landing"]');
      const hasLandingPageContent = landingPageElement !== null && 
                                    document.querySelector('h1')?.textContent?.includes('Monetize Content with');
      
      // Only check for expected content if we're on a specific route
      // And only if we're CERTAIN we see landing page content
      if (hasLandingPageContent) {
        // Check for expected content markers
        const hasDashboardContent = document.querySelector('[data-page="dashboard"]') !== null;
        const hasMarketplaceContent = document.querySelector('[data-page="marketplace"]') !== null;
        const hasDocsContent = document.querySelector('[data-page="docs"]') !== null;
        
        // Only force navigation if we're on a route that should NOT have landing page content
        // AND we're absolutely certain we see landing page content
        // AND we don't see the expected content
        if (currentPath.startsWith('/dashboard') && !hasDashboardContent) {
          console.error('[RouteWrapper] Wrong content detected on dashboard route, forcing hard navigation');
          window.location.replace(currentPath + window.location.search + window.location.hash);
          return;
        }
        
        if (currentPath.startsWith('/marketplace') && !hasMarketplaceContent) {
          console.error('[RouteWrapper] Wrong content detected on marketplace route, forcing hard navigation');
          window.location.replace(currentPath + window.location.search + window.location.hash);
          return;
        }
        
        if (currentPath.startsWith('/docs') && !hasDocsContent) {
          console.error('[RouteWrapper] Wrong content detected on docs route, forcing hard navigation');
          window.location.replace(currentPath + window.location.search + window.location.hash);
          return;
        }
      }
    }, 1000); // Longer delay to ensure page is fully rendered
    
    return () => clearTimeout(checkContent);
  }, [pathname]);

  // Don't use key prop - it causes unnecessary remounts that remove content
  // Just render children directly
  return <>{children}</>;
}

