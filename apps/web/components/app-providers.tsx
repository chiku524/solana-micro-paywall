'use client';

import { SWRProvider } from '../lib/swr-config';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // TEMPORARILY SIMPLIFIED: Remove wallet providers to test if they're causing the issue
  // This will help us determine if the dynamic import is preventing React from mounting
  // Once we confirm pages work, we can add wallet providers back with a different approach
  return (
    <SWRProvider>
      {children}
    </SWRProvider>
  );
}

