'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction, SystemProgram, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { Button } from './ui/button';
import { Modal } from './ui/modal';
import { apiPost } from '@/lib/api';
import { formatSol } from '@/lib/utils';
import QRCode from 'qrcode';
import type { PaymentRequestResponse, VerifyPaymentResponse } from '@/types';

interface PaymentWidgetProps {
  merchantId: string;
  contentId: string;
  priceLamports: number;
  onPaymentSuccess?: (accessToken: string) => void;
  onPaymentError?: (error: Error) => void;
}

export function PaymentWidget({
  merchantId,
  contentId,
  priceLamports,
  onPaymentSuccess,
  onPaymentError,
}: PaymentWidgetProps) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePurchase = useCallback(async () => {
    try {
      if (!connected || !publicKey) {
        setIsOpen(true);
        setError('Please connect your wallet first');
        return;
      }

      setIsProcessing(true);
      setError('');

      // Create payment request
      const response = await apiPost<PaymentRequestResponse>(
        '/api/payments/create-payment-request',
        { contentId }
      );

      setPaymentIntentId(response.paymentIntent.id);
      setPaymentUrl(response.paymentUrl);

      // Generate QR code
      try {
        const qrCode = await QRCode.toDataURL(response.paymentUrl);
        setQrCodeDataUrl(qrCode);
      } catch (qrError) {
        console.error('QR code generation failed:', qrError);
      }

      // Use recipient address from API response (preferred)
      if (!response.recipientAddress) {
        throw new Error('Recipient address not provided in payment response');
      }
      
      const recipientPubkey = new PublicKey(response.recipientAddress);
      const amountLamports = priceLamports; // Use the exact amount from content

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports: amountLamports,
        })
      );

      // Add memo with nonce for verification
      const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
      const memoText = `Payment for ${response.paymentIntent.id}`;
      const memoBuffer = Buffer.from(memoText, 'utf-8');
      transaction.add({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: memoBuffer,
      });

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Verify payment
      const verifyResponse = await apiPost<{ success: boolean; paymentIntent: any }>(
        '/api/payments/verify-payment',
        {
          paymentIntentId: response.paymentIntent.id,
          transactionSignature: signature,
        }
      );

      if (!verifyResponse.success) {
        throw new Error('Payment verification failed');
      }

      // Create purchase
      const purchaseResponse = await apiPost<VerifyPaymentResponse>(
        '/api/purchases',
        {
          paymentIntentId: response.paymentIntent.id,
          transactionSignature: signature,
          payerAddress: publicKey.toString(),
        }
      );

      setIsProcessing(false);
      setIsOpen(false);
      onPaymentSuccess?.(purchaseResponse.accessToken);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
      onPaymentError?.(err);
    }
  }, [connected, publicKey, sendTransaction, connection, contentId, priceLamports, onPaymentSuccess, onPaymentError]);

  return (
    <>
      <div className="space-y-4">
        {!connected && (
          <div className="mb-4">
            <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-700" />
          </div>
        )}
        
        <Button
          onClick={handlePurchase}
          disabled={isProcessing || !connected}
          size="lg"
          className="w-full"
        >
          {isProcessing
            ? 'Processing Payment...'
            : `Purchase for ${formatSol(priceLamports)} SOL`}
        </Button>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Complete Payment">
        <div className="text-center space-y-4">
          {!connected ? (
            <>
              <p className="text-neutral-300 mb-4">
                Connect your Solana wallet to continue
              </p>
              <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-700 mx-auto" />
            </>
          ) : (
            <>
              {qrCodeDataUrl && (
                <div className="flex justify-center mb-4">
                  <Image
                    src={qrCodeDataUrl}
                    alt="Payment QR Code"
                    width={256}
                    height={256}
                    className="w-64 h-64"
                  />
                </div>
              )}
              
              {paymentUrl && (
                <div className="mb-4">
                  <p className="text-neutral-300 mb-2">
                    Or open the payment link:
                  </p>
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline break-all"
                  >
                    {paymentUrl}
                  </a>
                </div>
              )}

              <p className="text-sm text-neutral-400">
                {isProcessing
                  ? 'Waiting for transaction confirmation...'
                  : 'Payment will be automatically verified once confirmed on-chain'}
              </p>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
