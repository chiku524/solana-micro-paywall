'use client';

import { createConfig, http } from 'wagmi';
import {
  mainnet,
  polygon,
  base,
  arbitrum,
  optimism,
  bsc,
  avalanche,
} from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

const config = createConfig({
  chains: [mainnet, polygon, base, arbitrum, optimism, bsc, avalanche],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function EVMWalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { config as wagmiConfig };
