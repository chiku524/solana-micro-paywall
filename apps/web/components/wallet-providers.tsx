'use client';

import { useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

const DEFAULT_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';

interface WalletProvidersProps {
  children: React.ReactNode;
}

export function WalletProviders({ children }: WalletProvidersProps) {
  const [rpcEndpoint, setRpcEndpoint] = useState(DEFAULT_RPC_ENDPOINT);
  const [mounted, setMounted] = useState(false);

  // Only create wallets after mount to prevent any browser API access issues
  const wallets = useMemo(
    () => {
      if (!mounted) return [];
      try {
        // Only include wallets that are compatible with Edge Runtime
        // TorusWalletAdapter uses Node.js modules and causes build errors
        return [new SolflareWalletAdapter()];
      } catch (error) {
        console.error('[WalletProviders] Error creating wallet adapter:', error);
        return [];
      }
    },
    [mounted],
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

  // If wallets aren't ready yet, just render children to prevent blocking
  if (!mounted || wallets.length === 0) {
    return <>{children}</>;
  }

  return (
    <ConnectionProvider endpoint={rpcEndpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

