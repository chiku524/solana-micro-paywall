import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

export interface TransactionVerificationResult {
  valid: boolean;
  payerAddress?: string;
  recipientAddress?: string;
  amount?: number;
  memo?: string;
  error?: string;
}

/**
 * Verify a Solana transaction matches the expected payment intent
 */
export async function verifyPaymentTransaction(
  connection: Connection,
  signature: string,
  expectedRecipient: string,
  expectedAmountLamports: number,
  expectedMemo?: string
): Promise<TransactionVerificationResult> {
  try {
    // Get transaction with parsed account data
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) {
      return { valid: false, error: 'Transaction not found' };
    }

    if (tx.meta.err) {
      return { valid: false, error: `Transaction failed: ${JSON.stringify(tx.meta.err)}` };
    }

    const recipientPubkey = new PublicKey(expectedRecipient);
    const preBalances = tx.meta.preBalances || [];
    const postBalances = tx.meta.postBalances || [];
    const accountKeys = tx.transaction.message.accountKeys;

    // Find recipient account index
    const recipientIndex = accountKeys.findIndex(
      (key) => key.toString() === expectedRecipient
    );

    if (recipientIndex === -1) {
      return { valid: false, error: 'Recipient address not found in transaction' };
    }

    // Calculate amount received by recipient
    const preBalance = preBalances[recipientIndex] || 0;
    const postBalance = postBalances[recipientIndex] || 0;
    const amountReceived = postBalance - preBalance;

    // Verify amount (allow small tolerance for transaction fees being paid by recipient)
    if (amountReceived < expectedAmountLamports * 0.99) {
      return {
        valid: false,
        error: `Amount mismatch: expected ${expectedAmountLamports}, received ${amountReceived}`,
      };
    }

    // Extract payer address (first signer)
    const payerAddress = accountKeys[0]?.toString() || '';

    // Extract memo if present
    let memo: string | undefined;
    for (const instruction of tx.transaction.message.instructions) {
      // Check if this is a memo instruction
      if ('programId' in instruction) {
        const programId = instruction.programId.toString();
        if (programId === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr') {
          if ('data' in instruction) {
            try {
              const data = instruction.data;
              if (typeof data === 'string') {
                memo = Buffer.from(data, 'base64').toString('utf-8');
              } else if (data instanceof Uint8Array || Buffer.isBuffer(data)) {
                memo = Buffer.from(data).toString('utf-8');
              }
            } catch (e) {
              // Memo parsing failed, continue
            }
          }
        }
      }
    }

    // Verify memo if expected
    if (expectedMemo && memo && !memo.includes(expectedMemo)) {
      return { valid: false, error: 'Memo mismatch' };
    }

    return {
      valid: true,
      payerAddress,
      recipientAddress: expectedRecipient,
      amount: amountReceived,
      memo,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Transaction verification failed',
    };
  }
}
