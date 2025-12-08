'use client';

/**
 * Wrapper to ensure pages render correctly during client-side navigation
 * This is a simple pass-through component that doesn't interfere with rendering
 */
export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  // Simply pass through children - don't add any logic that could block rendering
  return <>{children}</>;
}

