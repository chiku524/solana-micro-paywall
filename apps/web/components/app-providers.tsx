'use client';

import { useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
// Note: TorusWalletAdapter removed due to Edge Runtime compatibility issues
// It uses Node.js modules (crypto, stream) that aren't available in Edge Runtime
import { SWRProvider } from '../lib/swr-config';
import '@solana/wallet-adapter-react-ui/styles.css';

const DEFAULT_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const [rpcEndpoint, setRpcEndpoint] = useState(DEFAULT_RPC_ENDPOINT);

  const wallets = useMemo(
    () => {
      // Only create wallets after mount to prevent hydration issues
      if (typeof window === 'undefined') return [];
      // Only include wallets that are compatible with Edge Runtime
      // TorusWalletAdapter uses Node.js modules and causes build errors
      return [new SolflareWalletAdapter()];
    },
    [],
  );

  useEffect(() => {
    setMounted(true);
    
    // Load network from localStorage
    const savedNetwork = localStorage.getItem('solana-network');
    if (savedNetwork === 'mainnet-beta') {
      const mainnetRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_MAINNET || 'https://api.mainnet-beta.solana.com';
      setRpcEndpoint(mainnetRpc);
    } else {
      setRpcEndpoint(DEFAULT_RPC_ENDPOINT);
    }

    // Listen for network changes
    const handleNetworkChange = (event: CustomEvent) => {
      setRpcEndpoint(event.detail.rpc);
    };

    window.addEventListener('solana-network-changed', handleNetworkChange as EventListener);
    return () => {
      window.removeEventListener('solana-network-changed', handleNetworkChange as EventListener);
    };
  }, []);

  // CRITICAL: Don't render wallet providers until mounted to prevent hydration mismatches
  // Wallet adapters access browser APIs that don't exist during SSR
  if (!mounted) {
    return (
      <SWRProvider>
        {children}
      </SWRProvider>
    );
  }

  return (
    <SWRProvider>
      <ConnectionProvider endpoint={rpcEndpoint}>
        <WalletProvider wallets={wallets} autoConnect={true}>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SWRProvider>
  );
}

