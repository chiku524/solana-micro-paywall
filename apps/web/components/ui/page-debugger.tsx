'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Debug component to log what's happening with page rendering
 */
export function PageDebugger() {
  const pathname = usePathname();

  useEffect(() => {
    console.log('[PageDebugger] Pathname changed:', pathname);
    console.log('[PageDebugger] Window location:', window.location.href);
    
    // Check what's in the DOM after a delay
    setTimeout(() => {
      const children = document.querySelector('body > *');
      const appProviders = document.querySelector('[data-app-providers]');
      const pageContent = document.querySelector('[data-page]');
      const errorBoundary = document.querySelector('[class*="error"]');
      const mainContent = document.querySelector('main');
      const allDataPages = document.querySelectorAll('[data-page]');
      
      // Check React root
      const reactRoot = document.getElementById('__next');
      const reactRootContent = reactRoot?.innerHTML?.substring(0, 200);
      
      console.log('[PageDebugger] DOM check:', {
        pathname,
        hasBodyChildren: !!children,
        hasAppProviders: !!appProviders,
        hasPageContent: !!pageContent,
        hasErrorBoundary: !!errorBoundary,
        hasMainContent: !!mainContent,
        allDataPages: Array.from(allDataPages).map(el => ({
          page: el.getAttribute('data-page'),
          route: el.getAttribute('data-route'),
          hasContent: el.textContent?.length > 0,
        })),
        bodyChildrenCount: document.body.children.length,
        reactRootExists: !!reactRoot,
        reactRootContent: reactRootContent,
        bodyHTML: document.body.innerHTML.substring(0, 500),
      });
      
      // Check for React errors
      const reactErrors = (window as any).__REACT_ERRORS__ || [];
      if (reactErrors.length > 0) {
        console.error('[PageDebugger] React errors detected:', reactErrors);
      }
    }, 1000);
  }, [pathname]);

  return null;
}

