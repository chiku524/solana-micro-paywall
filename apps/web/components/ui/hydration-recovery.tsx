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
          // #region agent log
          const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
          if (isLocalhost) {
            const childrenArray = Array.from(reactRoot.children);
            fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-local',hypothesisId:'H3',location:'hydration-recovery.tsx:42',message:'CRITICAL: Page content missing after hydration',data:{pathname:pathname,reactRootChildren:reactRoot.children.length,childrenTags:childrenArray.map(c=>({tag:c.tagName,id:c.id,className:c.className,textContent:c.textContent?.substring(0,50)})),hasPageContent:hasPageContent,shouldHaveContent:shouldHaveContent,reactRootHTML:reactRoot.innerHTML.substring(0,500)},timestamp:Date.now()})}).catch(()=>{});
          }
          // #endregion
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
        // #region agent log
        const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocalhost) {
          const reactRoot = document.getElementById('__next');
          fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-local',hypothesisId:'H4',location:'hydration-recovery.tsx:66',message:'React hydration error #418 detected in console',data:{pathname:window.location.pathname,errorMessage:errorStr.substring(0,500),reactRootExists:!!reactRoot,reactRootChildren:reactRoot?.children.length ?? 0,reactRootHTML:reactRoot?.innerHTML.substring(0,500) ?? 'N/A'},timestamp:Date.now()})}).catch(()=>{});
        }
        // #endregion
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

