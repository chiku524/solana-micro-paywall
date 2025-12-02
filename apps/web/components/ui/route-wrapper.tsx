'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

/**
 * Wrapper component that forces re-renders on route changes
 * This ensures that page components properly unmount and remount when navigating
 */
export function RouteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [routeKey, setRouteKey] = useState(pathname);

  // Update route key when pathname changes to force complete remount
  useEffect(() => {
    setRouteKey(pathname);
    setMounted(true);
  }, [pathname]);

  useEffect(() => {
    // Force a scroll to top on route change
    window.scrollTo(0, 0);
    
    // Check if wrong content is being displayed after a delay
    const checkContent = setTimeout(() => {
      if (typeof window === 'undefined') return;
      
      const currentPath = window.location.pathname;
      
      // Check for landing page content
      const hasLandingPageContent = document.querySelector('h1')?.textContent?.includes('Monetize Content with') ||
                                    document.querySelector('[data-page="landing"]') !== null;
      
      // Check for dashboard content
      const hasDashboardContent = document.querySelector('h1')?.textContent?.includes('Dashboard') ||
                                  document.querySelector('h1')?.textContent?.includes('Merchant Dashboard') ||
                                  document.querySelector('form') !== null ||
                                  document.querySelector('[data-page="dashboard"]') !== null;
      
      // Check for marketplace content
      const hasMarketplaceContent = document.querySelector('h1')?.textContent?.includes('Discover Premium Content') ||
                                    document.querySelector('[data-page="marketplace"]') !== null;
      
      // If we're on dashboard but seeing landing page content, force a hard navigation
      if (currentPath.startsWith('/dashboard') && hasLandingPageContent && !hasDashboardContent) {
        console.error('[RouteWrapper] Wrong content detected on dashboard route, forcing hard navigation');
        // Use replace to avoid adding to history
        window.location.replace(currentPath + window.location.search + window.location.hash);
        return;
      }
      
      // If we're on marketplace but seeing landing page content, force a hard navigation
      if (currentPath.startsWith('/marketplace') && hasLandingPageContent && !hasMarketplaceContent) {
        console.error('[RouteWrapper] Wrong content detected on marketplace route, forcing hard navigation');
        window.location.replace(currentPath + window.location.search + window.location.hash);
        return;
      }
    }, 200);
    
    return () => clearTimeout(checkContent);
  }, [pathname]);

  // Use pathname as key to force React to unmount/remount components on route change
  // The key change forces React to treat this as a completely new component tree
  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div 
      key={routeKey} 
      data-route-wrapper={pathname}
      data-route-key={routeKey}
      style={{ display: 'contents' }}
    >
      {children}
    </div>
  );
}

