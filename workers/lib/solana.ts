import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export interface SolanaConfig {
  rpcUrl: string;
  heliusApiKey?: string;
}

export function getRpcUrl(config: SolanaConfig): string {
  if (config.heliusApiKey) {
    return `${config.rpcUrl}?api-key=${config.heliusApiKey}`;
  }
  return config.rpcUrl;
}

export function createConnection(config: SolanaConfig): Connection {
  return new Connection(getRpcUrl(config), 'confirmed');
}

export async function verifyTransaction(
  connection: Connection,
  signature: string,
  expectedRecipient: string,
  expectedAmount: number,
  expectedMemo?: string
): Promise<boolean> {
  try {
    // Get transaction
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) {
      return false;
    }

    if (tx.meta.err) {
      return false;
    }

    // Verify recipient received the expected amount
    const recipientPubkey = new PublicKey(expectedRecipient);
    let receivedAmount = 0;

    for (const postBalance of tx.meta.postTokenBalances || []) {
      if (postBalance.owner === expectedRecipient) {
        // For token transfers, check token balances
        // For SOL transfers, check account balances
        // This is simplified - you may need to handle both cases
      }
    }

    // Check SOL balance changes
    // Note: This is a legacy function - use verifyPaymentTransaction from transaction-verification.ts instead
    const accountKeys = tx.transaction.message instanceof Transaction
      ? tx.transaction.message.accountKeys
      : (tx.transaction.message as any).staticAccountKeys || [];
    const recipientIndex = accountKeys.findIndex(
      (key: any) => key.toString() === expectedRecipient
    );

    if (recipientIndex !== -1) {
      const preBalance = tx.meta.preBalances[recipientIndex] || 0;
      const postBalance = tx.meta.postBalances[recipientIndex] || 0;
      receivedAmount = postBalance - preBalance;
    }

    // Verify amount (with small tolerance for transaction fees)
    if (receivedAmount < expectedAmount) {
      return false;
    }

    // Verify memo if provided
    if (expectedMemo) {
      const memoInstruction = tx.transaction.message.instructions.find(
        (ix) => ix.programId.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
      );
      
      if (!memoInstruction || !('data' in memoInstruction)) {
        return false;
      }

      // Decode memo (simplified - actual decoding depends on instruction format)
      const memoData = Buffer.from((memoInstruction as any).data).toString('utf-8');
      if (!memoData.includes(expectedMemo)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}

// Generate a unique nonce for payment requests
export function generateNonce(): string {
  return crypto.randomUUID();
}

// Convert lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

// Convert SOL to lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}
