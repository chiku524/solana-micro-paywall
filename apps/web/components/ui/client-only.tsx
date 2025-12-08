'use client';

import { useEffect, useState } from 'react';

/**
 * Client-only wrapper that prevents hydration mismatches
 * by only rendering children after the component has mounted on the client
 */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

