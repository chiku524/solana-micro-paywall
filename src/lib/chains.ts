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
