'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Wrapper component that forces re-renders on route changes
 * This ensures that page components properly unmount and remount when navigating
 */
export function RouteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Force a scroll to top on route change to ensure proper page rendering
    window.scrollTo(0, 0);
  }, [pathname]);

  // Use pathname as key to force React to unmount/remount components on route change
  // Using a wrapper div with no styling to avoid layout issues
  return <div key={pathname} style={{ display: 'contents' }}>{children}</div>;
}

