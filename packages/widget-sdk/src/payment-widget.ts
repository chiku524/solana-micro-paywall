import { EventEmitter } from 'eventemitter3';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { createQR } from '@solana/pay';
import type { PaymentRequestConfig, PaymentRequestResponse, PaymentEvent, WidgetConfig } from './types.js';
import { ApiClient } from './api-client.js';

export class PaymentWidget extends EventEmitter<{ payment: [PaymentEvent] }> {
  private apiClient: ApiClient;
  private currentPaymentRequest: PaymentRequestResponse | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private rpcConnection: Connection | null = null;
  private config: Required<Pick<WidgetConfig, 'apiUrl'>> & Partial<WidgetConfig>;

  constructor(config: WidgetConfig & { apiUrl?: string }) {
    super();
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:3000/api',
      theme: config.theme || 'auto',
      buttonText: config.buttonText || 'Pay with Solana',
      ...config,
    };
    this.apiClient = new ApiClient(this.config.apiUrl);
  }

  /**
   * Initialize RPC connection if needed
   */
  private getConnection(): Connection {
    if (!this.rpcConnection) {
      const rpcUrl = typeof window !== 'undefined' 
        ? (window as any).__SOLANA_RPC__ || 'https://api.devnet.solana.com'
        : 'https://api.devnet.solana.com';
      
      this.rpcConnection = new Connection(rpcUrl, 'confirmed');
    }
    return this.rpcConnection;
  }

  /**
   * Create a payment request
   */
  async requestPayment(paymentConfig: PaymentRequestConfig): Promise<PaymentRequestResponse> {
    try {
      this.emit('payment', { type: 'payment_requested', paymentIntentId: '' });

      const response = await this.apiClient.createPaymentRequest({
        ...paymentConfig,
        apiUrl: this.config.apiUrl,
      });

      this.currentPaymentRequest = response;
      this.emit('payment', { type: 'payment_requested', paymentIntentId: response.paymentIntentId });

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('payment', { type: 'payment_failed', error: err.message });
      this.config.onPaymentError?.(err);
      throw err;
    }
  }

  /**
   * Generate QR code for payment
   */
  async generateQR(paymentRequest: PaymentRequestResponse): Promise<string> {
    try {
      // Use qrcode library for proper QR code generation
      const QRCode = await import('qrcode');
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.default.toDataURL(paymentRequest.solanaPayUrl, {
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      return qrDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Poll for payment status
   */
  async pollPaymentStatus(
    txSignature: string,
    merchantId: string,
    contentId: string,
    options?: { interval?: number; timeout?: number }
  ): Promise<string> {
    const interval = options?.interval || 2000; // 2 seconds
    const timeout = options?.timeout || 300000; // 5 minutes
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      // Clear any existing polling
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }

      this.pollingInterval = setInterval(async () => {
        try {
          // Check timeout
          if (Date.now() - startTime > timeout) {
            clearInterval(this.pollingInterval!);
            this.pollingInterval = null;
            reject(new Error('Payment polling timeout'));
            return;
          }

          // Check if transaction is confirmed on-chain
          const connection = this.getConnection();
          const status = await connection.getSignatureStatus(txSignature);

          if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
            // Transaction confirmed, verify with backend
            try {
              const verifyResponse = await this.apiClient.verifyPayment(txSignature, merchantId, contentId);
              
              clearInterval(this.pollingInterval!);
              this.pollingInterval = null;
              
              this.emit('payment', {
                type: 'payment_confirmed',
                token: verifyResponse.accessToken,
                paymentId: verifyResponse.paymentId,
              });

              this.config.onPaymentSuccess?.(verifyResponse.accessToken);
              resolve(verifyResponse.accessToken);
            } catch (verifyError) {
              // Verification failed, continue polling
              console.warn('Payment verification failed, continuing to poll:', verifyError);
            }
          }
        } catch (error) {
          console.error('Error polling payment status:', error);
        }
      }, interval);

      // Clean up on error
      setTimeout(() => {
        if (this.pollingInterval) {
          clearInterval(this.pollingInterval);
          this.pollingInterval = null;
          reject(new Error('Payment polling timeout'));
        }
      }, timeout);
    });
  }

  /**
   * Connect wallet and send payment
   */
  async connectWalletAndPay(
    paymentRequest: PaymentRequestResponse,
    options?: { connection?: Connection; merchantId?: string; contentId?: string }
  ): Promise<string> {
    // Check if wallet adapter is available
    if (typeof window === 'undefined') {
      throw new Error('Wallet connection requires browser environment');
    }

    const walletAdapter = (window as any).solana;
    
    if (!walletAdapter) {
      throw new Error('Solana wallet not found. Please install Phantom, Solflare, or another Solana wallet.');
    }

    try {
      // Connect wallet if not already connected
      if (!walletAdapter.isConnected) {
        await walletAdapter.connect();
      }
      
      const publicKey = walletAdapter.publicKey;
      if (!publicKey) {
        throw new Error('Failed to get wallet public key');
      }

      // Parse Solana Pay URL - it's in the format: solana:https://... or https://...
      const recipient = new PublicKey(paymentRequest.recipient);
      const amount = BigInt(paymentRequest.amount);

      // Create transaction using Solana Pay standard
      // For now, we'll use a simplified approach that works with Phantom
      const connection = options?.connection || this.getConnection();
      const { Transaction, SystemProgram, TransactionInstruction } = await import('@solana/web3.js');
      
      const transaction = new Transaction();
      
      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports: Number(amount),
        })
      );

      // Add memo instruction if available
      if (paymentRequest.memo) {
        const memoProgram = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
        transaction.add(
          new TransactionInstruction({
            keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
            programId: memoProgram,
            data: Buffer.from(paymentRequest.memo),
          })
        );
      }

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signed = await walletAdapter.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      this.emit('payment', { type: 'payment_pending', txSignature: signature });

      // Verify with backend and poll for token
      const merchantId = options?.merchantId || '';
      const contentId = options?.contentId || '';
      
      // Start polling for confirmation
      return this.pollPaymentStatus(signature, merchantId, contentId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('payment', { type: 'payment_failed', error: err.message });
      this.config.onPaymentError?.(err);
      throw err;
    }
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopPolling();
    this.removeAllListeners();
    this.currentPaymentRequest = null;
    this.rpcConnection = null;
  }
}

