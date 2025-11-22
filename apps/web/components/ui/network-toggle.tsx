'use client';

import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { 
  ComputerDesktopIcon,
  ServerIcon 
} from '@heroicons/react/24/outline';

type Network = 'devnet' | 'mainnet-beta';

const NETWORK_CONFIGS: Record<Network, { rpc: string; label: string; color: string }> = {
  'devnet': {
    rpc: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
    label: 'Devnet',
    color: 'yellow'
  },
  'mainnet-beta': {
    rpc: process.env.NEXT_PUBLIC_SOLANA_RPC_MAINNET || 'https://api.mainnet-beta.solana.com',
    label: 'Mainnet',
    color: 'emerald'
  }
};

export function NetworkToggle() {
  const [network, setNetwork] = useState<Network>('devnet');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from localStorage
    const saved = localStorage.getItem('solana-network') as Network;
    if (saved && (saved === 'devnet' || saved === 'mainnet-beta')) {
      setNetwork(saved);
    } else {
      // Default from env
      const envNetwork = process.env.NEXT_PUBLIC_SOLANA_NETWORK as Network;
      if (envNetwork === 'mainnet-beta' || envNetwork === 'devnet') {
        setNetwork(envNetwork);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Save to localStorage
    localStorage.setItem('solana-network', network);
    
    // Update global RPC endpoint for wallet adapter
    if (typeof window !== 'undefined') {
      const config = NETWORK_CONFIGS[network];
      (window as any).__SOLANA_RPC__ = config.rpc;
      (window as any).__SOLANA_NETWORK__ = network;
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('solana-network-changed', {
        detail: { network, rpc: config.rpc }
      }));
    }
  }, [network, mounted]);

  if (!mounted) {
    return null;
  }

  const config = NETWORK_CONFIGS[network];
  const isMainnet = network === 'mainnet-beta';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-400 hidden sm:inline">Network:</span>
      <button
        onClick={() => setNetwork(isMainnet ? 'devnet' : 'mainnet-beta')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
          isMainnet
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
        } hover:opacity-80`}
        title={`Currently on ${config.label}. Click to switch.`}
      >
        {isMainnet ? (
          <>
            <ServerIcon className="h-4 w-4" />
            <span>Mainnet</span>
          </>
        ) : (
          <>
            <ComputerDesktopIcon className="h-4 w-4" />
            <span>Devnet</span>
          </>
        )}
      </button>
    </div>
  );
}

