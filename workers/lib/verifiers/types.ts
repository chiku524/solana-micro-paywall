import type { Env } from '../../types';

/**
 * Result of on-chain transaction verification.
 * Used by all chain-specific verifiers (Solana, Ethereum, etc.).
 */
export interface VerifierResult {
  valid: boolean;
  payerAddress?: string;
  recipientAddress?: string;
  amount?: number;
  memo?: string;
  error?: string;
}

/**
 * Chain-agnostic transaction verifier interface.
 * Add a new chain by implementing this interface and registering in index.ts.
 */
export interface TransactionVerifier {
  verify(
    env: Env,
    signature: string,
    expectedRecipient: string,
    expectedAmount: number,
    expectedMemo?: string
  ): Promise<VerifierResult>;
}
