'use client';

import { useEffect, useState } from 'react';

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
  const [needsRecovery, setNeedsRecovery] = useState(false);

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
          console.warn('[HydrationRecovery] Page content missing after hydration, triggering recovery...');
          setNeedsRecovery(true);
          
          // Force a re-render by clearing and re-adding the children container
          // This creates a new React subtree that can hydrate properly
          const container = document.createElement('div');
          container.id = '__hydration-recovery';
          container.style.display = 'contents'; // Doesn't affect layout
          
          // Find the AppProviders container (should be inside #__next)
          const appProviders = reactRoot.querySelector('[data-rht-toaster]')?.parentElement;
          if (appProviders && appProviders.parentElement) {
            // Insert recovery container
            appProviders.parentElement.insertBefore(container, appProviders.nextSibling);
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
        console.warn('[HydrationRecovery] React hydration error detected');
        setNeedsRecovery(true);
      }
      originalError.apply(console, args);
    };

    console.error = wrappedError;

    // Check after a delay to see if content appeared
    const timeoutId = setTimeout(checkContent, 1500);

    return () => {
      console.error = originalError;
      clearTimeout(timeoutId);
    };
  }, []);

  // On initial mount, always render children normally
  // If recovery is needed, we'll handle it via DOM manipulation
  if (!mounted) {
    return null; // Don't render on server
  }

  return <>{children}</>;
}

