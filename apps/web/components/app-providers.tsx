'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SWRProvider } from '../lib/swr-config';

const DEFAULT_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';

// Dynamically import wallet providers to prevent SSR hydration issues
// These components access browser APIs that don't exist during SSR
const WalletProviders = dynamic(
  () => import('./wallet-providers').then((mod) => mod.WalletProviders),
  { 
    ssr: false,
    loading: () => null, // Don't show loading state to prevent layout shift
  }
);

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // CRITICAL: Always render the same structure to prevent hydration errors
  // SWRProvider is safe for SSR, wallet providers are loaded client-only
  return (
    <SWRProvider>
      {mounted ? (
        <WalletProviders>
          {children}
        </WalletProviders>
      ) : (
        // Render children directly during SSR and initial client render
        // This ensures consistent HTML structure
        <>{children}</>
      )}
    </SWRProvider>
  );
}

