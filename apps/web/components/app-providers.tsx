'use client';

import { SWRProvider } from '../lib/swr-config';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Always render SWRProvider - it's safe for SSR
  // The issue was likely with useSearchParams requiring Suspense, not the provider
  return (
    <SWRProvider>
      {children}
    </SWRProvider>
  );
}

