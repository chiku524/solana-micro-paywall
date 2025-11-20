"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useMemo, useState, useEffect } from "react";

import "@solana/wallet-adapter-react-ui/styles.css";

type DashboardProvidersProps = {
  children: React.ReactNode;
};

const DEFAULT_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com";

export function DashboardProviders({ children }: DashboardProvidersProps) {
  // Only initialize wallets on client side to prevent hydration errors
  const [mounted, setMounted] = useState(false);
  
  const wallets = useMemo(
    () => {
      // Phantom is now a standard wallet, no need to explicitly add it
      // Only add non-standard wallets
      return [new SolflareWalletAdapter(), new TorusWalletAdapter()];
    },
    [],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always render providers, but wallets won't be initialized until mounted
  // This prevents WalletContext errors while still avoiding hydration issues
  return (
    <ConnectionProvider endpoint={DEFAULT_RPC_ENDPOINT}>
      <WalletProvider wallets={mounted ? wallets : []} autoConnect={mounted}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

