'use client';

import { useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

const DEFAULT_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';

interface MarketplaceProvidersProps {
  children: React.ReactNode;
}

export function MarketplaceProviders({ children }: MarketplaceProvidersProps) {
  const [mounted, setMounted] = useState(false);

  const wallets = useMemo(
    () => {
      return [new SolflareWalletAdapter(), new TorusWalletAdapter()];
    },
    [],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ConnectionProvider endpoint={DEFAULT_RPC_ENDPOINT}>
      <WalletProvider wallets={mounted ? wallets : []} autoConnect={mounted}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

