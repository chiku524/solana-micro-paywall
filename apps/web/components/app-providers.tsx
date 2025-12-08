'use client';

import { SWRProvider } from '../lib/swr-config';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Always render SWRProvider consistently on both server and client
  // SWRProvider is safe for SSR - it only provides context
  return (
    <SWRProvider>
      {children}
    </SWRProvider>
  );
}

