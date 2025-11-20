import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey, TransactionResponse, VersionedTransactionResponse, Commitment, Finality, clusterApiUrl } from '@solana/web3.js';

@Injectable()
export class SolanaService implements OnModuleInit {
  private readonly logger = new Logger(SolanaService.name);
  private primaryConnection!: Connection;
  private fallbackConnection?: Connection;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const rpcEndpoint = this.configService.get<string>('SOLANA_RPC_ENDPOINT') || clusterApiUrl('devnet');
    const wsEndpoint = this.configService.get<string>('SOLANA_WS_ENDPOINT');
    const fallbackEndpoint = this.configService.get<string>('SOLANA_RPC_ENDPOINT_FALLBACK');

    // Create connection with optional WebSocket endpoint
    const connectionOptions: any = {
      commitment: 'confirmed',
    };

    // Only set wsEndpoint if provided (Helius WebSocket may need special handling)
    if (wsEndpoint) {
      connectionOptions.wsEndpoint = wsEndpoint;
    }

    this.primaryConnection = new Connection(rpcEndpoint, connectionOptions);

    if (fallbackEndpoint) {
      this.fallbackConnection = new Connection(fallbackEndpoint, {
        commitment: 'confirmed',
      });
    }

    // Log without exposing API keys
    const sanitizedRpc = rpcEndpoint.replace(/\?api-key=[^&]*/, '?api-key=***');
    this.logger.log(`Solana RPC connected to ${sanitizedRpc}`);
    if (fallbackEndpoint) {
      this.logger.log(`Fallback RPC configured: ${fallbackEndpoint}`);
    }
  }

  /**
   * Get the primary RPC connection
   */
  getConnection(): Connection {
    return this.primaryConnection;
  }

  /**
   * Get a connection (primary or fallback) with automatic retry
   */
  async getConnectionWithFallback(): Promise<Connection> {
    try {
      // Quick health check
      await this.primaryConnection.getSlot();
      return this.primaryConnection;
    } catch (error) {
      this.logger.warn('Primary RPC connection failed, using fallback', error);
      if (this.fallbackConnection) {
        return this.fallbackConnection;
      }
      throw new Error('No available RPC connection');
    }
  }

  /**
   * Verify a transaction signature and check finality
   */
  async verifyTransaction(
    signature: string,
    options?: {
      commitment?: Finality;
      maxRetries?: number;
    }
  ): Promise<TransactionResponse | VersionedTransactionResponse | null> {
    const connection = await this.getConnectionWithFallback();
    const commitment: Finality = (options?.commitment || 'confirmed') as Finality;
    const maxRetries = options?.maxRetries || 10;

    try {
      let attempts = 0;
      while (attempts < maxRetries) {
        const tx = await connection.getTransaction(signature, {
          commitment,
          maxSupportedTransactionVersion: 0,
        }) as TransactionResponse | VersionedTransactionResponse | null;

        if (tx) {
          return tx;
        }

        attempts++;
        if (attempts < maxRetries) {
          // Exponential backoff: 500ms, 1s, 2s, 4s...
          await new Promise((resolve) => setTimeout(resolve, Math.min(500 * Math.pow(2, attempts - 1), 5000)));
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to verify transaction ${signature}`, error);
      throw error;
    }
  }

  /**
   * Check if a transaction is confirmed/finalized
   */
  async isTransactionConfirmed(signature: string, commitment: Commitment = 'confirmed'): Promise<boolean> {
    try {
      const connection = await this.getConnectionWithFallback();
      const status = await connection.getSignatureStatus(signature);
      return status?.value?.confirmationStatus === commitment || status?.value?.confirmationStatus === 'finalized';
    } catch (error) {
      this.logger.error(`Failed to check transaction confirmation for ${signature}`, error);
      return false;
    }
  }

  /**
   * Validate a Solana address
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse a Solana address to PublicKey
   */
  parseAddress(address: string): PublicKey {
    try {
      return new PublicKey(address);
    } catch (error) {
      throw new Error(`Invalid Solana address: ${address}`);
    }
  }

  /**
   * Get current slot
   */
  async getCurrentSlot(): Promise<number> {
    const connection = await this.getConnectionWithFallback();
    return connection.getSlot();
  }

  /**
   * Get block time for a slot
   */
  async getBlockTime(slot: number): Promise<number | null> {
    const connection = await this.getConnectionWithFallback();
    return connection.getBlockTime(slot);
  }

  /**
   * Extract memo from transaction instructions
   * Memo program ID: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
   */
  extractMemoFromTransaction(
    tx: TransactionResponse | VersionedTransactionResponse
  ): string | null {
    try {
      const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
      const memoProgramPubkey = new PublicKey(MEMO_PROGRAM_ID);

      // Handle both legacy and versioned transactions
      let instructions: any[] = [];
      let accountKeys: (PublicKey | string)[] = [];
      
      if ('message' in tx.transaction) {
        // Versioned transaction
        if ('instructions' in tx.transaction.message) {
          instructions = tx.transaction.message.instructions;
          accountKeys = tx.transaction.message.staticAccountKeys || [];
        } else if ('compiledInstructions' in tx.transaction.message) {
          // For versioned transactions, resolve instructions
          const compiled = tx.transaction.message.compiledInstructions;
          accountKeys = tx.transaction.message.staticAccountKeys || [];
          instructions = compiled.map((ix: any) => {
            const programIdKey = accountKeys[ix.programIdIndex];
            return {
              programId: programIdKey?.toString(),
              data: ix.data,
            };
          });
        }
      } else {
        // Legacy transaction - type assertion needed for TypeScript
        const legacyTx = tx.transaction as any;
        if ('instructions' in legacyTx) {
          instructions = legacyTx.instructions;
          accountKeys = legacyTx.message?.accountKeys || [];
        }
      }

      // Find memo instruction
      for (const instruction of instructions) {
        let programId: string | null = null;
        
        if (instruction.programId) {
          programId = instruction.programId.toString();
        } else if (instruction.programIdIndex !== undefined && accountKeys[instruction.programIdIndex]) {
          programId = accountKeys[instruction.programIdIndex].toString();
        }
        
        if (programId === MEMO_PROGRAM_ID) {
          // Extract memo data
          let data = instruction.data;
          
          if (!data) {
            continue;
          }

          // Handle different data formats
          if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
            // Already a buffer/uint8array, convert to string
            return Buffer.from(data).toString('utf-8').replace(/\0/g, '').trim();
          } else if (typeof data === 'string') {
            // Try to decode if it's base58/base64, otherwise use as-is
            try {
              // Check if it looks like base58 (Solana format)
              const buffer = Buffer.from(data, 'base64');
              const decoded = buffer.toString('utf-8').replace(/\0/g, '').trim();
              if (decoded.length > 0) {
                return decoded;
              }
            } catch {
              // Not base64, try as direct string
              return data.replace(/\0/g, '').trim();
            }
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.warn('Failed to extract memo from transaction', error);
      return null;
    }
  }
}

