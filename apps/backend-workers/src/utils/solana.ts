/**
 * Solana utilities for Cloudflare Workers
 * Uses fetch-based RPC calls (no @solana/web3.js dependency)
 */

export interface SolanaRpcResponse<T = any> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Validate a Solana address format
 */
export function isValidAddress(address: string): boolean {
  try {
    // Base58 decode check (simplified - just check format)
    if (!address || address.length < 32 || address.length > 44) {
      return false;
    }
    // Check for valid base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Regex.test(address);
  } catch {
    return false;
  }
}

/**
 * Call Solana RPC endpoint
 */
export async function callSolanaRpc(
  endpoint: string,
  method: string,
  params: any[] = []
): Promise<any> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Solana RPC error: ${response.statusText}`);
  }

  const data: SolanaRpcResponse = await response.json();

  if (data.error) {
    throw new Error(`Solana RPC error: ${data.error.message}`);
  }

  return data.result;
}

/**
 * Get transaction details
 */
export async function getTransaction(
  endpoint: string,
  signature: string,
  commitment: string = 'confirmed'
): Promise<any> {
  return callSolanaRpc(endpoint, 'getTransaction', [
    signature,
    {
      encoding: 'jsonParsed',
      maxSupportedTransactionVersion: 0,
      commitment,
    },
  ]);
}

/**
 * Get signature status
 */
export async function getSignatureStatus(
  endpoint: string,
  signature: string
): Promise<any> {
  return callSolanaRpc(endpoint, 'getSignatureStatus', [signature]);
}

/**
 * Verify transaction is confirmed
 */
export async function isTransactionConfirmed(
  endpoint: string,
  signature: string
): Promise<boolean> {
  try {
    const status = await getSignatureStatus(endpoint, signature);
    return (
      status?.value?.confirmationStatus === 'confirmed' ||
      status?.value?.confirmationStatus === 'finalized'
    );
  } catch {
    return false;
  }
}

/**
 * Extract memo from transaction
 */
export function extractMemoFromTransaction(tx: any): string | null {
  try {
    const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
    
    if (!tx?.transaction?.message?.instructions) {
      return null;
    }

    const instructions = tx.transaction.message.instructions;
    
    for (const instruction of instructions) {
      if (instruction.programId === MEMO_PROGRAM_ID) {
        // Memo data is typically in the data field
        if (instruction.data) {
          // Decode base64 if needed
          try {
            const decoded = atob(instruction.data);
            return decoded.replace(/\0/g, '').trim();
          } catch {
            return instruction.data;
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

