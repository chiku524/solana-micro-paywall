/**
 * Chain-agnostic utilities for multi-blockchain support.
 * Add new chains by extending CHAIN_CONFIGS and implementing:
 * - Backend: workers/lib/verifiers/<chain>-verifier.ts
 * - Frontend: wallet adapter for the chain (see docs/architecture.md)
 */

import type { SupportedChain } from '@/types';

export interface ChainConfig {
  id: SupportedChain;
  name: string;
  symbol: string;
  /** Smallest unit decimals (e.g. 9 for SOL, 18 for ETH) */
  decimals: number;
  /** Block explorer base URL for transactions */
  explorerTxUrl: string;
}

export const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig> = {
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    explorerTxUrl: 'https://solscan.io/tx',
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    explorerTxUrl: 'https://etherscan.io/tx',
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    explorerTxUrl: 'https://polygonscan.com/tx',
  },
  base: {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    explorerTxUrl: 'https://basescan.org/tx',
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ETH',
    decimals: 18,
    explorerTxUrl: 'https://arbiscan.io/tx',
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    explorerTxUrl: 'https://optimistic.etherscan.io/tx',
  },
  bnb: {
    id: 'bnb',
    name: 'BNB Chain',
    symbol: 'BNB',
    decimals: 18,
    explorerTxUrl: 'https://bscscan.com/tx',
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
    explorerTxUrl: 'https://snowtrace.io/tx',
  },
};

/** EVM chains that share the same verification logic */
export const EVM_CHAINS: SupportedChain[] = [
  'ethereum', 'polygon', 'base', 'arbitrum', 'optimism', 'bnb', 'avalanche',
];

/** Chain IDs for EVM networks (for wallet/viem) */
export const EVM_CHAIN_IDS: Record<'ethereum' | 'polygon' | 'base' | 'arbitrum' | 'optimism' | 'bnb' | 'avalanche', number> = {
  ethereum: 1,
  polygon: 137,
  base: 8453,
  arbitrum: 42161,
  optimism: 10,
  bnb: 56,
  avalanche: 43114,
};

/**
 * Get block explorer URL for a transaction. Use this instead of hardcoding Solscan/etc.
 */
export function getExplorerTxUrl(chain: SupportedChain, txSignature: string): string {
  const config = CHAIN_CONFIGS[chain];
  return `${config.explorerTxUrl}/${txSignature}`;
}

/**
 * Format amount from smallest unit (lamports/wei) to human-readable string.
 * Prefer currency from content/payment when available; otherwise use chain symbol.
 */
export function formatAmount(
  chain: SupportedChain,
  amountSmallestUnit: number,
  options?: { decimals?: number; symbol?: string }
): string {
  const config = CHAIN_CONFIGS[chain];
  const decimals = options?.decimals ?? 4;
  const divisor = 10 ** config.decimals;
  const value = (amountSmallestUnit / divisor).toFixed(decimals);
  const symbol = options?.symbol ?? config.symbol;
  return `${value} ${symbol}`;
}

/** Default chain for the app until content/merchant chain is stored */
export const DEFAULT_CHAIN: SupportedChain = 'solana';

/** Get EVM chain ID for a supported chain (throws if not EVM) */
export function getEvmChainId(chain: SupportedChain): number {
  if (chain === 'solana') {
    throw new Error('Solana is not an EVM chain');
  }
  return EVM_CHAIN_IDS[chain];
}

/** Check if a chain is EVM-based */
export function isEvmChain(chain: SupportedChain): chain is (typeof EVM_CHAINS)[number] {
  return EVM_CHAINS.includes(chain);
}
