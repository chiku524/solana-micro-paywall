'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { PaymentWidget } from './payment-widget';
import type { WidgetConfig, PaymentRequestResponse } from './types';

export interface ReactWidgetProps extends WidgetConfig {
  containerId?: string;
  className?: string;
  onPaymentSuccess?: (token: string) => void;
  onPaymentError?: (error: Error) => void;
}

export function SolanaPaywallWidget({
  merchantId,
  slug,
  apiUrl = 'http://localhost:3000/api',
  theme = 'auto',
  buttonText = 'Pay with Solana',
  showPreview = false,
  previewText,
  autoCheckAccess = true,
  redirectAfterPayment,
  onPaymentSuccess,
  onPaymentError,
  className = '',
}: ReactWidgetProps) {
  const { publicKey, signTransaction, connected } = useWallet();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(autoCheckAccess);
  const [paymentIntent, setPaymentIntent] = useState<PaymentRequestResponse | null>(null);
  const [content, setContent] = useState<any>(null);
  const widgetRef = useRef<PaymentWidget | null>(null);

  useEffect(() => {
    widgetRef.current = new PaymentWidget({
      apiUrl,
      theme,
      buttonText,
      onPaymentSuccess: (token) => {
        setHasAccess(true);
        if (onPaymentSuccess) {
          onPaymentSuccess(token);
        }
        if (redirectAfterPayment) {
          window.location.href = redirectAfterPayment;
        }
      },
      onPaymentError: (error) => {
        if (onPaymentError) {
          onPaymentError(error);
        }
      },
    });

    return () => {
      widgetRef.current?.destroy();
    };
  }, [apiUrl, theme, buttonText, onPaymentSuccess, onPaymentError, redirectAfterPayment]);

  useEffect(() => {
    if (autoCheckAccess && merchantId && slug) {
      checkAccess();
    }
  }, [autoCheckAccess, merchantId, slug]);

  const checkAccess = async () => {
    setCheckingAccess(true);
    try {
      const token = localStorage.getItem(`access_${merchantId}_${slug}`);
      if (token) {
        // Verify token
        const response = await fetch(`${apiUrl}/payments/redeem-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (response.ok) {
          setHasAccess(true);
        }
      }
    } catch (error) {
      console.error('Access check failed:', error);
    } finally {
      setCheckingAccess(false);
    }
  };

  const loadContent = async () => {
    try {
      const response = await fetch(`${apiUrl}/contents/merchant/${merchantId}/slug/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  };

  useEffect(() => {
    if (merchantId && slug) {
      loadContent();
    }
  }, [merchantId, slug, apiUrl]);

  const handlePurchase = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    if (!content) {
      await loadContent();
      return;
    }

    setLoading(true);
    try {
      const intent = await widgetRef.current!.requestPayment({
        merchantId,
        contentId: content.id,
      });
      setPaymentIntent(intent);

      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
      );
      const recipient = new PublicKey(intent.recipient);
      const amount = BigInt(intent.amount);

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports: Number(amount),
        }),
      );

      // Add memo
      const memoProgram = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
      transaction.add({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
        programId: memoProgram,
        data: Buffer.from(intent.memo),
      });

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
      });

      await connection.confirmTransaction(signature, 'confirmed');

      await widgetRef.current!.pollPaymentStatus(signature, merchantId, content.id);
    } catch (error: any) {
      console.error('Payment error:', error);
      if (onPaymentError) {
        onPaymentError(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      setLoading(false);
      setPaymentIntent(null);
    }
  };

  if (checkingAccess) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (hasAccess) {
    return (
      <div className={`rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 ${className}`}>
        <p className="text-emerald-400">✓ You have access to this content</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className={`rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  const price = Number(content.priceLamports) / 1e9;

  return (
    <div className={`rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 ${className}`}>
      {showPreview && previewText && (
        <div className="mb-4 rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
          <p className="text-sm text-neutral-300">{previewText}</p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-2xl font-bold text-emerald-400">
          {price.toFixed(4)} {content.currency}
        </p>
        {content.durationSecs && (
          <p className="mt-1 text-sm text-neutral-400">
            Access for {Math.floor(content.durationSecs / 3600)} hour{Math.floor(content.durationSecs / 3600) !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {!connected ? (
        <div className="rounded-lg bg-yellow-500/20 border border-yellow-500/50 p-3 mb-4">
          <p className="text-sm text-yellow-400">Please connect your Solana wallet to purchase</p>
        </div>
      ) : (
        <button
          onClick={handlePurchase}
          disabled={loading || !!paymentIntent}
          className="w-full rounded-lg bg-emerald-500 px-6 py-3 font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? 'Processing...' : paymentIntent ? 'Confirm in wallet...' : buttonText}
        </button>
      )}

      {paymentIntent && (
        <div className="mt-4 rounded-lg bg-blue-500/20 border border-blue-500/50 p-3">
          <p className="text-sm text-blue-400">Payment intent created. Please confirm the transaction in your wallet.</p>
        </div>
      )}
    </div>
  );
}

