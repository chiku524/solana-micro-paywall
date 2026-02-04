import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatAmount as formatAmountChain } from './chains';
import type { SupportedChain } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format amount in smallest unit (lamports/wei) - use for display. Prefer formatAmount with chain. */
export function formatSol(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(4);
}

/** Chain-aware amount formatting. Use when content has a chain. */
export function formatAmount(
  chain: SupportedChain,
  amountSmallestUnit: number,
  options?: { decimals?: number; symbol?: string }
): string {
  return formatAmountChain(chain, amountSmallestUnit, options);
}

export function truncateAddress(address: string, start = 4, end = 4): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
