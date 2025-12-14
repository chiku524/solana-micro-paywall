'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Component to debug layout rendering and React hydration
 */
export function LayoutDebugger() {
  const pathname = usePathname();

  useEffect(() => {
    console.log('[LayoutDebugger] Component mounted');
    console.log('[LayoutDebugger] Current pathname:', pathname);
    console.log('[LayoutDebugger] Window location:', typeof window !== 'undefined' ? window.location.href : 'server');
    
    // Check if React has hydrated
    const checkHydration = () => {
      const reactRoot = document.querySelector('#__next');
      if (reactRoot) {
        console.log('[LayoutDebugger] React root found:', reactRoot);
        console.log('[LayoutDebugger] React root children count:', reactRoot.children.length);
      } else {
        console.error('[LayoutDebugger] React root (#__next) not found!');
      }
      
      // Check for dashboard content
      const dashboardContent = document.querySelector('[data-page="dashboard"]');
      if (dashboardContent) {
        console.log('[LayoutDebugger] Dashboard content element found:', dashboardContent);
      } else {
        console.warn('[LayoutDebugger] Dashboard content element NOT found');
      }
    };
    
    // Check immediately and after a delay
    checkHydration();
    setTimeout(checkHydration, 100);
    setTimeout(checkHydration, 500);
    setTimeout(checkHydration, 1000);
  }, [pathname]);

  return null;
}

