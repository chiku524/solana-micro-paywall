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
      // CRITICAL: Check for React root - Next.js should create #__next
      const reactRoot = document.querySelector('#__next');
      if (reactRoot) {
        console.log('[LayoutDebugger] React root found:', reactRoot);
        console.log('[LayoutDebugger] React root children count:', reactRoot.children.length);
        console.log('[LayoutDebugger] React root HTML:', reactRoot.innerHTML.substring(0, 200));
      } else {
        console.error('[LayoutDebugger] CRITICAL: React root (#__next) not found!');
        console.error('[LayoutDebugger] Document body:', document.body);
        console.error('[LayoutDebugger] Document body children:', document.body.children.length);
        console.error('[LayoutDebugger] Document body HTML:', document.body.innerHTML.substring(0, 500));
        
        // Check if body has any content at all
        const bodyChildren = Array.from(document.body.children);
        console.error('[LayoutDebugger] Body children:', bodyChildren.map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
        })));
      }
      
      // Check for dashboard content
      const dashboardContent = document.querySelector('[data-page="dashboard"]');
      if (dashboardContent) {
        console.log('[LayoutDebugger] Dashboard content element found:', dashboardContent);
      } else {
        console.warn('[LayoutDebugger] Dashboard content element NOT found');
      }
      
      // Check for Next.js data
      const nextData = (window as any).__NEXT_DATA__;
      if (nextData) {
        console.log('[LayoutDebugger] __NEXT_DATA__ found:', {
          page: nextData.page,
          pathname: nextData.pathname,
          props: nextData.props ? 'present' : 'missing',
        });
      } else {
        console.error('[LayoutDebugger] CRITICAL: __NEXT_DATA__ not found! Next.js may not be initialized.');
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

