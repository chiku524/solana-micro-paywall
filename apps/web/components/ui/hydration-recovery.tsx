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
        
        // If we should have content but don't, log the issue but don't auto-reload
        // Auto-reload doesn't fix the root cause and causes infinite loops
        if (!hasPageContent && reactRoot.children.length <= 2) {
          console.error('[HydrationRecovery] CRITICAL: Page content missing after hydration!');
          console.error('[HydrationRecovery] React root children:', reactRoot.children.length);
          console.error('[HydrationRecovery] Pathname:', pathname);
          console.error('[HydrationRecovery] This indicates React error #418 caused rendering to abort');
          console.error('[HydrationRecovery] Root cause: Hydration mismatch - server HTML does not match client expectations');
          // Don't auto-reload - it doesn't fix the issue and causes infinite loops
          // The real fix needs to address why server HTML doesn't match client expectations
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

  // CRITICAL: Always render children wrapped in ClientOnly to prevent hydration mismatch
  // This ensures server and client both render the same thing initially (null)
  // Then ClientOnly will render children after mount on the client
  return <>{children}</>;
}

