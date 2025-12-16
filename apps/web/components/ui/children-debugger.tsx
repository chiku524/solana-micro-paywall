'use client';

import { useEffect, useRef } from 'react';

/**
 * Component to debug what's happening with the children prop
 */
export function ChildrenDebugger({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[ChildrenDebugger] Component mounted');
    console.log('[ChildrenDebugger] Children:', children);
    console.log('[ChildrenDebugger] Children type:', typeof children);
    console.log('[ChildrenDebugger] Children is null:', children === null);
    console.log('[ChildrenDebugger] Children is undefined:', children === undefined);
    
    // Check if children is a React element and inspect its structure
    if (children && typeof children === 'object' && 'type' in children) {
      console.log('[ChildrenDebugger] Children is React element, type:', (children as any).type?.name || (children as any).type);
      console.log('[ChildrenDebugger] Children props:', (children as any).props);
    }
    
    // #region agent log
    const childrenInfo = children && typeof children === 'object' && 'type' in children ? {
      type: (children as any).type?.name || (children as any).type?.toString() || 'unknown',
      hasProps: !!(children as any).props,
    } : null;
    fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'children-debugger.tsx:12',message:'ChildrenDebugger mounted',data:{childrenType:typeof children,isNull:children === null,isUndefined:children === undefined,childrenInfo:childrenInfo,hasContainer:!!containerRef.current,containerChildrenCount:containerRef.current?.children.length||0,containerHTML:containerRef.current?.innerHTML.substring(0,200)||'none',containerOuterHTML:containerRef.current?.outerHTML.substring(0,300)||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (containerRef.current) {
      console.log('[ChildrenDebugger] Container children count:', containerRef.current.children.length);
      console.log('[ChildrenDebugger] Container HTML:', containerRef.current.innerHTML.substring(0, 300));
      console.log('[ChildrenDebugger] Container outer HTML:', containerRef.current.outerHTML.substring(0, 300));
      
      // Check what React sees
      const reactRoot = containerRef.current.closest('#__next');
      if (reactRoot) {
        console.log('[ChildrenDebugger] React root children:', reactRoot.children.length);
        console.log('[ChildrenDebugger] React root HTML:', reactRoot.innerHTML.substring(0, 500));
      }
    }
    
    // Check after a delay to see if React hydrates later
    setTimeout(() => {
      if (containerRef.current) {
        console.log('[ChildrenDebugger] After delay - Container children count:', containerRef.current.children.length);
        console.log('[ChildrenDebugger] After delay - Container HTML:', containerRef.current.innerHTML.substring(0, 300));
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'children-debugger.tsx:35',message:'ChildrenDebugger after delay',data:{containerChildrenCount:containerRef.current.children.length,containerHTML:containerRef.current.innerHTML.substring(0,200)||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }
    }, 1000);
  }, [children]);

  return (
    <div ref={containerRef} data-children-debugger>
      {children}
    </div>
  );
}

