'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { useAccount, useSendTransaction, useSwitchChain, useConnect } from 'wagmi';
import { Button } from './ui/button';
import { Modal } from './ui/modal';
import { apiPost } from '@/lib/api';
import { formatAmount, EVM_CHAIN_IDS } from '@/lib/chains';
import QRCode from 'qrcode';
import type { VerifyPaymentResponse, PaymentIntent } from '@/types';
import type { SupportedChain } from '@/types';

interface PaymentRequestResponse {
  paymentIntent: PaymentIntent;
  paymentUrl: string;
  recipientAddress?: string;
  chain?: string;
  chainId?: number;
  amountWei?: number;
}

interface PaymentWidgetProps {
  merchantId: string;
  contentId: string;
  priceLamports: number;
  chain?: SupportedChain;
  onPaymentSuccess?: (accessToken: string) => void;
  onPaymentError?: (error: Error) => void;
}

function EVMConnectButton() {
  const { connect, connectors, isPending } = useConnect();
  const injected = connectors.find((c) => c.type === 'injected') ?? connectors[0];
  return (
    <button
      type="button"
      onClick={() => injected && connect({ connector: injected })}
      disabled={!injected || isPending}
      className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

function SolanaPaymentFlow({
  contentId,
  priceLamports,
  onPaymentSuccess,
  onPaymentError,
}: {
  contentId: string;
  priceLamports: number;
  onPaymentSuccess?: (accessToken: string) => void;
  onPaymentError?: (error: Error) => void;
}) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePurchase = useCallback(async () => {
    try {
      if (!connected || !publicKey) {
        setIsOpen(true);
        setError('Please connect your Solana wallet first');
        return;
      }

      setIsProcessing(true);
      setError('');

      const response = await apiPost<PaymentRequestResponse>(
        '/api/payments/create-payment-request',
        { contentId }
      );

      setPaymentUrl(response.paymentUrl);

      try {
        const qrCode = await QRCode.toDataURL(response.paymentUrl);
        setQrCodeDataUrl(qrCode);
      } catch (qrError) {
        console.error('QR code generation failed:', qrError);
      }

      if (!response.recipientAddress) {
        throw new Error('Recipient address not provided in payment response');
      }

      const recipientPubkey = new PublicKey(response.recipientAddress);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports: priceLamports,
        })
      );

      const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
      const memoText = `Payment for ${response.paymentIntent.id}`;
      const memoBuffer = Buffer.from(memoText, 'utf-8');
      transaction.add({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: memoBuffer,
      });

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      const verifyResponse = await apiPost<{ success: boolean; paymentIntent?: PaymentIntent }>(
        '/api/payments/verify-payment',
        {
          paymentIntentId: response.paymentIntent.id,
          transactionSignature: signature,
        }
      );

      if (!verifyResponse.success) {
        throw new Error('Payment verification failed');
      }

      const purchaseResponse = await apiPost<VerifyPaymentResponse>('/api/purchases', {
        paymentIntentId: response.paymentIntent.id,
        transactionSignature: signature,
        payerAddress: publicKey.toString(),
      });

      setIsProcessing(false);
      setIsOpen(false);
      onPaymentSuccess?.(purchaseResponse.accessToken);
    } catch (err: unknown) {
      console.error('Payment error:', err);
      const message = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      setError(message);
      setIsProcessing(false);
      onPaymentError?.(err instanceof Error ? err : new Error(message));
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
          {isProcessing ? 'Processing...' : `Purchase for ${formatAmount('solana', priceLamports)}`}
        </Button>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Complete Payment">
        <div className="text-center space-y-4">
          {!connected ? (
            <>
              <p className="text-neutral-300 mb-4">Connect your Solana wallet to continue</p>
              <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-700 mx-auto" />
            </>
          ) : (
            <>
              {qrCodeDataUrl && (
                <div className="flex justify-center mb-4">
                  <Image src={qrCodeDataUrl} alt="Payment QR Code" width={256} height={256} className="w-64 h-64" />
                </div>
              )}
              {paymentUrl && (
                <div className="mb-4">
                  <p className="text-neutral-300 mb-2">Or open the payment link:</p>
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline break-all text-sm"
                  >
                    {paymentUrl}
                  </a>
                </div>
              )}
              <p className="text-sm text-neutral-400">
                {isProcessing ? 'Waiting for confirmation...' : 'Payment will be verified once confirmed on-chain'}
              </p>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

function EVMPaymentFlow({
  contentId,
  priceLamports,
  chain,
  onPaymentSuccess,
  onPaymentError,
}: {
  contentId: string;
  priceLamports: number;
  chain: Exclude<SupportedChain, 'solana'>;
  onPaymentSuccess?: (accessToken: string) => void;
  onPaymentError?: (error: Error) => void;
}) {
  const { address, isConnected, chain: currentChain } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const targetChainId = EVM_CHAIN_IDS[chain];

  const handlePurchase = useCallback(async () => {
    try {
      if (!isConnected || !address) {
        setIsOpen(true);
        setError('Please connect your wallet first');
        return;
      }

      setIsProcessing(true);
      setError('');

      // Switch chain if needed
      if (currentChain?.id !== targetChainId && switchChainAsync) {
        await switchChainAsync({ chainId: targetChainId });
      }

      const response = await apiPost<PaymentRequestResponse>(
        '/api/payments/create-payment-request',
        { contentId }
      );

      if (!response.recipientAddress || !response.chainId) {
        throw new Error('Invalid payment response');
      }

      const hash = await sendTransactionAsync({
        to: response.recipientAddress as `0x${string}`,
        value: BigInt(priceLamports),
        data: undefined,
      });

      if (!hash) {
        throw new Error('Transaction failed');
      }

      const verifyResponse = await apiPost<{ success: boolean }>('/api/payments/verify-payment', {
        paymentIntentId: response.paymentIntent.id,
        transactionSignature: hash,
      });

      if (!verifyResponse.success) {
        throw new Error('Payment verification failed');
      }

      const purchaseResponse = await apiPost<VerifyPaymentResponse>('/api/purchases', {
        paymentIntentId: response.paymentIntent.id,
        transactionSignature: hash,
        payerAddress: address,
      });

      setIsProcessing(false);
      setIsOpen(false);
      onPaymentSuccess?.(purchaseResponse.accessToken);
    } catch (err: unknown) {
      console.error('Payment error:', err);
      const message = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      setError(message);
      setIsProcessing(false);
      onPaymentError?.(err instanceof Error ? err : new Error(message));
    }
  }, [isConnected, address, currentChain?.id, targetChainId, switchChainAsync, sendTransactionAsync, contentId, priceLamports, onPaymentSuccess, onPaymentError]);

  return (
    <>
      <div className="space-y-4">
        {!isConnected && (
          <div className="mb-4">
            <EVMConnectButton />
          </div>
        )}
        <Button
          onClick={handlePurchase}
          disabled={isProcessing || !isConnected}
          size="lg"
          className="w-full"
        >
          {isProcessing ? 'Processing...' : `Purchase for ${formatAmount(chain, priceLamports)}`}
        </Button>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Complete Payment">
        <div className="text-center space-y-4">
          {!isConnected ? (
            <>
              <p className="text-neutral-300 mb-4">Connect your wallet (MetaMask, Rainbow, etc.) to continue</p>
              <EVMConnectButton />
            </>
          ) : (
            <p className="text-sm text-neutral-400">Click Purchase above to complete the transaction.</p>
          )}
        </div>
      </Modal>
    </>
  );
}

export function PaymentWidget({
  merchantId,
  contentId,
  priceLamports,
  chain = 'solana',
  onPaymentSuccess,
  onPaymentError,
}: PaymentWidgetProps) {
  const isEvm = chain !== 'solana';

  if (isEvm) {
    return (
      <EVMPaymentFlow
        contentId={contentId}
        priceLamports={priceLamports}
        chain={chain}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    );
  }

  return (
    <SolanaPaymentFlow
      contentId={contentId}
      priceLamports={priceLamports}
      onPaymentSuccess={onPaymentSuccess}
      onPaymentError={onPaymentError}
    />
  );
}
