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
        // #region agent log
        const childrenArray = Array.from(reactRoot.children);
        fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout-debugger.tsx:22',message:'LayoutDebugger checkHydration',data:{pathname:pathname,reactRootExists:true,childrenCount:reactRoot.children.length,childrenTags:childrenArray.map(c=>({tag:c.tagName,id:c.id,className:c.className})),hasDashboardContent:!!document.querySelector('[data-page="dashboard"]'),hasAppProviders:!!document.querySelector('[data-rht-toaster]')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } else {
        console.error('[LayoutDebugger] CRITICAL: React root (#__next) not found!');
        console.error('[LayoutDebugger] Document body:', document.body);
        console.error('[LayoutDebugger] Document body children:', document.body.children.length);
        console.error('[LayoutDebugger] Document body HTML:', document.body.innerHTML.substring(0, 500));
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout-debugger.tsx:28',message:'LayoutDebugger react root NOT found',data:{pathname:pathname,bodyChildren:document.body.children.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
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
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout-debugger.tsx:41',message:'Dashboard content found',data:{pathname:pathname,hasContent:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
      } else {
        console.warn('[LayoutDebugger] Dashboard content element NOT found');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout-debugger.tsx:45',message:'Dashboard content NOT found',data:{pathname:pathname,hasContent:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
      }
      
      // Check for Next.js data
      const nextData = (window as any).__NEXT_DATA__;
      if (nextData) {
        console.log('[LayoutDebugger] __NEXT_DATA__ found:', {
          page: nextData.page,
          pathname: nextData.pathname,
          props: nextData.props ? 'present' : 'missing',
        });
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout-debugger.tsx:49',message:'__NEXT_DATA__ found',data:{pathname:pathname,nextDataPage:nextData.page,nextDataPathname:nextData.pathname,hasProps:!!nextData.props},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
      } else {
        console.error('[LayoutDebugger] CRITICAL: __NEXT_DATA__ not found! Next.js may not be initialized.');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout-debugger.tsx:57',message:'__NEXT_DATA__ NOT found',data:{pathname:pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
      }
      
      // Check for React hydration errors
      const errorOverlay = document.querySelector('[data-nextjs-dialog]');
      if (errorOverlay) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout-debugger.tsx:60',message:'React error overlay detected',data:{pathname:pathname,hasErrorOverlay:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
    };
    
    // Check immediately and after a delay
    checkHydration();
    setTimeout(checkHydration, 100);
    setTimeout(checkHydration, 500);
    setTimeout(checkHydration, 1000);
    
    // Listen for React hydration errors
    const originalError = console.error;
    console.error = (...args) => {
      const errorStr = args.join(' ');
      if (errorStr.includes('418') || errorStr.includes('hydration') || errorStr.includes('Hydration')) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout-debugger.tsx:70',message:'React hydration error detected in console',data:{pathname:pathname,errorMessage:errorStr.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
      originalError.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, [pathname]);

  return null;
}

