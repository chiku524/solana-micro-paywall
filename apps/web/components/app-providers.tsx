'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SWRProvider } from '../lib/swr-config';

const DEFAULT_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';

// Dynamically import wallet providers to prevent SSR hydration issues
// These components access browser APIs that don't exist during SSR
const WalletProviders = dynamic(
  () => import('./wallet-providers').then((mod) => mod.WalletProviders).catch((error) => {
    console.error('[AppProviders] Failed to load WalletProviders:', error);
    // Return a fallback component that just renders children
    return { default: ({ children }: { children: React.ReactNode }) => <>{children}</> };
  }),
  { 
    ssr: false,
    loading: () => null, // Don't show loading state to prevent layout shift
  }
);

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // CRITICAL: Always render the exact same structure to prevent hydration errors
  // WalletProviders uses dynamic import with ssr: false, so it won't render during SSR
  // But we always include it in the tree so the structure is consistent
  // During SSR: WalletProviders renders nothing (due to ssr: false)
  // After hydration: WalletProviders renders normally
  // If WalletProviders fails to load, the dynamic import catch will provide a fallback
  return (
    <SWRProvider>
      <WalletProviders>
        {children}
      </WalletProviders>
    </SWRProvider>
  );
}

