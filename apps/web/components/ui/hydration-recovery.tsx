'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * CRITICAL: Hydration Error Recovery Component
 * 
 * When React encounters a hydration mismatch (error #418), it stops rendering children.
 * This component detects hydration failures and forces a client-side re-render by
 * creating a new React root that bypasses the failed hydration.
 * 
 * This is a workaround for the hydration mismatch issue on Cloudflare Pages.
 */
export function HydrationRecovery({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [forceClientRender, setForceClientRender] = useState(false);
  const recoveryContainerRef = useRef<HTMLDivElement | null>(null);
  const recoveryRootRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check if page content is missing after React should have hydrated
    const checkContent = () => {
      const reactRoot = document.getElementById('__next');
      if (!reactRoot) return;

      const pathname = window.location.pathname;
      const shouldHaveContent = pathname !== '/' && pathname !== '';
      
      if (shouldHaveContent) {
        // Look for page-specific content markers
        const hasPageContent = 
          document.querySelector('[data-page]') ||
          document.querySelector('main') ||
          document.querySelector('[role="main"]') ||
          reactRoot.children.length > 2; // More than just background + toaster
        
        // If we should have content but don't, trigger recovery
        if (!hasPageContent && reactRoot.children.length <= 2) {
          console.warn('[HydrationRecovery] Page content missing after hydration, forcing client-side render...');
          
          // Create a recovery container and render children into it with a new React root
          // This bypasses the failed hydration
          const container = document.createElement('div');
          container.id = '__hydration-recovery';
          container.setAttribute('data-hydration-recovery', 'true');
          
          // Find where to insert it (inside AppProviders, after toaster)
          const toaster = reactRoot.querySelector('[data-rht-toaster]');
          const appProviders = toaster?.parentElement;
          
          if (appProviders) {
            appProviders.appendChild(container);
            recoveryContainerRef.current = container;
            
            // Force a page reload as last resort - this is more reliable than trying to re-render
            // The hydration error means server and client HTML don't match, so we need a fresh start
            console.warn('[HydrationRecovery] Forcing page reload to recover from hydration error...');
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }
        }
      }
    };

    // Listen for React hydration errors
    const originalError = console.error;
    let hydrationErrorDetected = false;

    const wrappedError = (...args: any[]) => {
      const errorStr = args.join(' ');
      // Check for React error #418 (hydration mismatch)
      if ((errorStr.includes('418') || 
           errorStr.includes('hydration') || 
           errorStr.includes('Hydration') ||
           errorStr.includes('Minified React error')) && 
          !hydrationErrorDetected) {
        hydrationErrorDetected = true;
        console.warn('[HydrationRecovery] React hydration error #418 detected, will attempt recovery...');
        // Don't set state here - let checkContent handle it after delay
      }
      originalError.apply(console, args);
    };

    console.error = wrappedError;

    // Check after a delay to see if content appeared
    const timeoutId = setTimeout(checkContent, 2000);

    return () => {
      console.error = originalError;
      clearTimeout(timeoutId);
      // Clean up recovery root if it was created
      if (recoveryRootRef.current && recoveryContainerRef.current) {
        try {
          recoveryRootRef.current.unmount();
        } catch (e) {
          // Ignore unmount errors
        }
      }
    };
  }, [children]);

  // On initial mount, always render children normally
  // Recovery will happen via DOM manipulation if needed
  if (!mounted) {
    return null; // Don't render on server
  }

  // If we're forcing a client render, don't render here (recovery container handles it)
  if (forceClientRender && recoveryContainerRef.current) {
    return null;
  }

  return <>{children}</>;
}

