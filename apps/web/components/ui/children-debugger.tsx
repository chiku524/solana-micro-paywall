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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'children-debugger.tsx:12',message:'ChildrenDebugger mounted',data:{childrenType:typeof children,isNull:children === null,isUndefined:children === undefined,hasContainer:!!containerRef.current,containerChildrenCount:containerRef.current?.children.length||0,containerHTML:containerRef.current?.innerHTML.substring(0,200)||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (containerRef.current) {
      console.log('[ChildrenDebugger] Container children count:', containerRef.current.children.length);
      console.log('[ChildrenDebugger] Container HTML:', containerRef.current.innerHTML.substring(0, 300));
    }
  }, [children]);

  return (
    <div ref={containerRef} data-children-debugger>
      {children}
    </div>
  );
}

