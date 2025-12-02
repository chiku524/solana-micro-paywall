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
      
      console.log('[PageDebugger] DOM check:', {
        pathname,
        hasBodyChildren: !!children,
        hasAppProviders: !!appProviders,
        hasPageContent: !!pageContent,
        bodyChildrenCount: document.body.children.length,
        bodyHTML: document.body.innerHTML.substring(0, 500),
      });
    }, 1000);
  }, [pathname]);

  return null;
}

