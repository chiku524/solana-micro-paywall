/**
 * EVM transaction verifier - works for Ethereum, Polygon, Base, Arbitrum, Optimism, BNB, Avalanche.
 * Verifies simple native token (ETH/MATIC/BNB/AVAX) transfers.
 */
import { createPublicClient, http, type Hash } from 'viem';
import { mainnet, polygon, base, arbitrum, optimism, bsc, avalanche } from 'viem/chains';
import type { Env } from '../../types';
import type { TransactionVerifier, VerifierResult } from './types';

const CHAIN_CONFIG: Record<string, { chain: typeof mainnet; defaultRpc: string }> = {
  ethereum: { chain: mainnet, defaultRpc: 'https://eth.llamarpc.com' },
  polygon: { chain: polygon, defaultRpc: 'https://polygon-rpc.com' },
  base: { chain: base, defaultRpc: 'https://mainnet.base.org' },
  arbitrum: { chain: arbitrum, defaultRpc: 'https://arb1.arbitrum.io/rpc' },
  optimism: { chain: optimism, defaultRpc: 'https://mainnet.optimism.io' },
  bnb: { chain: bsc, defaultRpc: 'https://bsc-dataseed.binance.org' },
  avalanche: { chain: avalanche, defaultRpc: 'https://api.avax.network/ext/bc/C/rpc' },
};

function getRpcUrl(env: Env, chainKey: string): string {
  const rpcMap: Record<string, string | undefined> = {
    ethereum: env.ETHEREUM_RPC_URL,
    polygon: env.POLYGON_RPC_URL,
    base: env.BASE_RPC_URL,
    arbitrum: env.ARBITRUM_RPC_URL,
    optimism: env.OPTIMISM_RPC_URL,
    bnb: env.BNB_RPC_URL,
    avalanche: env.AVALANCHE_RPC_URL,
  };
  return rpcMap[chainKey] || CHAIN_CONFIG[chainKey]?.defaultRpc || '';
}

function createVerifierForChain(chainKey: string): TransactionVerifier {
  return {
    async verify(
      env: Env,
      signature: string,
      expectedRecipient: string,
      expectedAmount: number,
      _expectedMemo?: string
    ): Promise<VerifierResult> {
      const config = CHAIN_CONFIG[chainKey];
      if (!config) {
        return { valid: false, error: `Unsupported EVM chain: ${chainKey}` };
      }

      const rpcUrl = getRpcUrl(env, chainKey);
      if (!rpcUrl) {
        return { valid: false, error: `No RPC URL configured for ${chainKey}` };
      }

      try {
        const client = createPublicClient({
          chain: config.chain,
          transport: http(rpcUrl),
        });

        const tx = await client.getTransaction({ hash: signature as Hash });
        if (!tx) {
          return { valid: false, error: 'Transaction not found' };
        }

        if (tx.blockNumber === null) {
          return { valid: false, error: 'Transaction not yet confirmed' };
        }

        // Normalize addresses (checksum)
        const normalizedRecipient = expectedRecipient.toLowerCase();
        const txTo = tx.to?.toLowerCase();

        if (txTo !== normalizedRecipient) {
          return {
            valid: false,
            error: `Recipient mismatch: expected ${normalizedRecipient}, got ${txTo}`,
          };
        }

        const value = BigInt(tx.value.toString());
        const expectedBig = BigInt(expectedAmount);

        // Allow 1% tolerance (e.g. for rounding)
        if (value < (expectedBig * 99n) / 100n) {
          return {
            valid: false,
            error: `Amount mismatch: expected ${expectedAmount}, got ${value.toString()}`,
          };
        }

        return {
          valid: true,
          payerAddress: tx.from,
          recipientAddress: tx.to ?? undefined,
          amount: Number(value),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return { valid: false, error: `Verification failed: ${msg}` };
      }
    },
  };
}

export const ethereumVerifier = createVerifierForChain('ethereum');
export const polygonVerifier = createVerifierForChain('polygon');
export const baseVerifier = createVerifierForChain('base');
export const arbitrumVerifier = createVerifierForChain('arbitrum');
export const optimismVerifier = createVerifierForChain('optimism');
export const bnbVerifier = createVerifierForChain('bnb');
export const avalancheVerifier = createVerifierForChain('avalanche');
