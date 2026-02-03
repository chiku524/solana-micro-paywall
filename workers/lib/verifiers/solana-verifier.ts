import { Connection } from '@solana/web3.js';
import type { Env } from '../../types';
import type { TransactionVerifier, VerifierResult } from './types';
import { verifyPaymentTransaction } from '../transaction-verification';

function getRpcUrl(env: Env): string {
  const base = env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  if (env.HELIUS_API_KEY) {
    return `${base}?api-key=${env.HELIUS_API_KEY}`;
  }
  return base;
}

export const solanaVerifier: TransactionVerifier = {
  async verify(
    env: Env,
    signature: string,
    expectedRecipient: string,
    expectedAmount: number,
    expectedMemo?: string
  ): Promise<VerifierResult> {
    const connection = new Connection(getRpcUrl(env), 'confirmed');
    return verifyPaymentTransaction(
      connection,
      signature,
      expectedRecipient,
      expectedAmount,
      expectedMemo
    );
  },
};
