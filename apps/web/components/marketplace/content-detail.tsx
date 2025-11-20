'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import Link from 'next/link';
import { apiClient, Content } from '../../lib/api-client';
import { showSuccess, showError, showLoading, updateToast } from '../../lib/toast';
import { logger } from '../../lib/logger';

interface ContentDetailProps {
  content: Content;
}

export function ContentDetail({ content }: ContentDetailProps) {
  const { publicKey, signTransaction, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);

  const price = Number(content.priceLamports) / 1e9;
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'One-time purchase';
    const hours = Math.floor(seconds / 3600);
    if (hours < 24) return `Access for ${hours} hour${hours !== 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `Access for ${days} day${days !== 1 ? 's' : ''}`;
  };

  useEffect(() => {
    // Check if user has access token
    const token = localStorage.getItem(`access_${content.merchant.id}_${content.slug}`);
    if (token) {
      // Verify token
      // For now, just check if token exists
      setHasAccess(true);
    }
  }, [content]);

  const handlePurchase = async () => {
    if (!connected || !publicKey) {
      showError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    const loadingToast = showLoading('Creating payment request...');
    
    try {
      // Create payment intent
      updateToast(loadingToast, 'Creating payment request...', 'loading');
      const intent = await apiClient.createPaymentRequest({
        merchantId: content.merchant.id,
        contentId: content.id,
      }) as any;
      setPaymentIntent(intent);

      // Create transaction
      updateToast(loadingToast, 'Preparing transaction...', 'loading');
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com');
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

      // Sign and send
      updateToast(loadingToast, 'Please confirm the transaction in your wallet...', 'loading');
      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
      });

      // Wait for confirmation
      updateToast(loadingToast, 'Waiting for transaction confirmation...', 'loading');
      await connection.confirmTransaction(signature, 'confirmed');

      // Verify payment
      updateToast(loadingToast, 'Verifying payment...', 'loading');
      const verifyResult = await apiClient.verifyPayment({
        txSignature: signature,
        merchantId: content.merchant.id,
        contentId: content.id,
      }) as any;

      // Store access token
      localStorage.setItem(`access_${content.merchant.id}_${content.slug}`, verifyResult.accessToken);
      setHasAccess(true);
      setPaymentIntent(null);
      updateToast(loadingToast, 'Payment successful! You now have access to this content.', 'success');
    } catch (error: any) {
      logger.error('Payment error', error instanceof Error ? error : new Error(String(error)), {
        contentId: content.id,
        merchantId: content.merchant.id,
      });
      const errorMessage = error.message || 'Unknown error';
      updateToast(loadingToast, `Payment failed: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (hasAccess) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <header className="border-b border-neutral-800 bg-neutral-900/60">
          <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/marketplace" className="text-emerald-400 hover:text-emerald-300">
              ← Back to Marketplace
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 mb-6">
            <p className="text-emerald-400">✓ You have access to this content</p>
          </div>

          <article className="prose prose-invert max-w-none">
            <h1 className="text-4xl font-bold text-white mb-4">{content.title || content.slug}</h1>
            {content.description && <p className="text-xl text-neutral-300 mb-6">{content.description}</p>}
            {content.previewText && (
              <div className="text-neutral-200 whitespace-pre-wrap">{content.previewText}</div>
            )}
            {content.canonicalUrl && (
              <div className="mt-8">
                <a
                  href={content.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-emerald-950 transition hover:bg-emerald-400"
                >
                  View Full Content →
                </a>
              </div>
            )}
          </article>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="border-b border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/marketplace" className="text-emerald-400 hover:text-emerald-300">
            ← Back to Marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {content.thumbnailUrl && (
          <div className="relative mb-8 h-64 w-full overflow-hidden rounded-lg bg-neutral-800">
            <img src={content.thumbnailUrl} alt={content.title || content.slug} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="mb-8">
          {content.category && (
            <span className="mb-4 inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-400">
              {content.category}
            </span>
          )}
          <h1 className="mb-4 text-4xl font-bold text-white">{content.title || content.slug}</h1>
          {content.description && <p className="mb-6 text-xl text-neutral-300">{content.description}</p>}
        </div>

        {/* Preview */}
        {content.previewText && (
          <div className="mb-8 rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Preview</h2>
            <p className="text-neutral-300">{content.previewText}</p>
          </div>
        )}

        {/* Purchase Card */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
          <div className="mb-6">
            <p className="text-3xl font-bold text-emerald-400">
              {price.toFixed(4)} {content.currency}
            </p>
            <p className="mt-2 text-neutral-400">{formatDuration(content.durationSecs)}</p>
          </div>

          {!connected ? (
            <div className="rounded-lg bg-yellow-500/20 border border-yellow-500/50 p-4 mb-4">
              <p className="text-yellow-400">Please connect your Solana wallet to purchase</p>
            </div>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full rounded-lg bg-emerald-500 px-6 py-3 font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Purchase with ${content.currency}`}
            </button>
          )}

          {paymentIntent && (
            <div className="mt-4 rounded-lg bg-blue-500/20 border border-blue-500/50 p-4">
              <p className="text-blue-400 text-sm">Payment intent created. Please confirm the transaction in your wallet.</p>
            </div>
          )}
        </div>

        {/* Merchant Info */}
        <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
          <h3 className="mb-2 text-lg font-semibold text-white">Merchant</h3>
          <p className="text-neutral-300">{content.merchant.email}</p>
        </div>
      </main>
    </div>
  );
}


