import type { SupportedChain } from '../../types';
import type { TransactionVerifier } from './types';
import { solanaVerifier } from './solana-verifier';

const verifiers: Partial<Record<SupportedChain, TransactionVerifier>> = {
  solana: solanaVerifier,
  // ethereum: ethereumVerifier,  // Add when implementing Ethereum
  // polygon: polygonVerifier,    // Add when implementing Polygon
};

/**
 * Get the transaction verifier for a chain. Use this in payment routes
 * instead of calling Solana/Ethereum logic directly.
 */
export function getVerifier(chain: SupportedChain = 'solana'): TransactionVerifier {
  const verifier = verifiers[chain];
  if (!verifier) {
    throw new Error(`Unsupported chain: ${chain}. Implement verifiers/${chain}-verifier.ts and register here.`);
  }
  return verifier;
}

export type { TransactionVerifier, VerifierResult } from './types';
