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

