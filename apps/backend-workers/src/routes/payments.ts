/**
 * Payments routes
 */

import { Hono } from 'hono';
import { Env } from '../types/env';
import { query, queryOne, execute } from '../utils/db';
import { isValidAddress, getTransaction, isTransactionConfirmed, extractMemoFromTransaction } from '../utils/solana';
import { rateLimit } from '../middleware/rate-limit';

function generateId(): string {
  return crypto.randomUUID();
}

function generateMemo(merchantId: string, contentId: string): string {
  return `PAY:${merchantId}:${contentId}:${Date.now()}`;
}

export function paymentsRoutes(app: Hono<{ Bindings: Env }>) {
  // Create payment request (public, rate limited)
  app.post('/payments/create-payment-request', rateLimit({ limit: 10, window: 60 }), async (c) => {
    try {
      const body = await c.req.json();
      const { merchantId, contentId, price, currency, duration } = body;

      if (!merchantId || !contentId) {
        return c.json({ error: 'Bad Request', message: 'merchantId and contentId are required' }, 400);
      }

      // Get merchant
      const merchant = await queryOne(c.env.DB, 'SELECT * FROM Merchant WHERE id = ? AND status = ?', [merchantId, 'active']);
      if (!merchant) {
        return c.json({ error: 'Not Found', message: 'Merchant not found or inactive' }, 404);
      }

      if (!merchant.payoutAddress) {
        return c.json({ error: 'Bad Request', message: 'Merchant must have a payout address configured' }, 400);
      }

      if (!isValidAddress(merchant.payoutAddress)) {
        return c.json({ error: 'Bad Request', message: 'Invalid merchant payout address' }, 400);
      }

      // Get content
      const content = await queryOne(c.env.DB, 'SELECT * FROM Content WHERE id = ? AND merchantId = ?', [contentId, merchantId]);
      if (!content) {
        return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
      }

      // Use provided price or content default
      const finalPrice = price !== undefined ? parseInt(price) : parseInt(content.priceLamports);
      const finalCurrency = currency || content.currency || 'SOL';
      const finalDuration = duration || content.durationSecs || 86400; // Default 24 hours

      // Generate memo and nonce
      const memo = generateMemo(merchantId, contentId);
      const nonce = crypto.randomUUID();

      // Calculate expiration (15 minutes for payment intent)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Create payment intent
      const paymentIntentId = generateId();
      await execute(
        c.env.DB,
        `INSERT INTO PaymentIntent (id, merchantId, contentId, amount, currency, memo, nonce, recipientAddress, expiresAt, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [paymentIntentId, merchantId, contentId, finalPrice, finalCurrency, memo, nonce, merchant.payoutAddress, expiresAt, 'pending']
      );

      // Generate Solana Pay URL
      const solanaPayUrl = `solana:${merchant.payoutAddress}?amount=${finalPrice}&reference=${nonce}&label=Payment for ${content.title || content.slug}&memo=${encodeURIComponent(memo)}`;

      return c.json({
        paymentIntentId,
        memo,
        solanaPayUrl,
        recipient: merchant.payoutAddress,
        amount: finalPrice.toString(),
        currency: finalCurrency,
        expiresAt,
      });
    } catch (error: any) {
      console.error('Create payment request error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Verify payment (public, rate limited)
  app.post('/payments/verify-payment', rateLimit({ limit: 20, window: 60 }), async (c) => {
    try {
      const body = await c.req.json();
      const { txSignature, merchantId, contentId } = body;

      if (!txSignature || !merchantId || !contentId) {
        return c.json({ error: 'Bad Request', message: 'txSignature, merchantId, and contentId are required' }, 400);
      }

      // Check if payment already exists
      const existingPayment = await queryOne(
        c.env.DB,
        'SELECT id, status FROM Payment WHERE transactionSignature = ?',
        [txSignature]
      );

      if (existingPayment) {
        if (existingPayment.status === 'confirmed') {
          // Get purchase
          const purchase = await queryOne(
            c.env.DB,
            'SELECT id FROM Purchase WHERE paymentId = ?',
            [existingPayment.id]
          );

          if (purchase) {
            // Get access token
            const accessToken = await queryOne<{ token: string }>(
              c.env.DB,
              'SELECT token FROM AccessToken WHERE paymentId = ? AND isRevoked = 0',
              [existingPayment.id]
            );

            return c.json({
              status: 'confirmed',
              accessToken: accessToken?.token || null,
              paymentId: existingPayment.id,
            });
          }
        }
        return c.json({ error: 'Bad Request', message: 'Payment already processed' }, 400);
      }

      // Verify transaction on Solana
      const rpcEndpoint = c.env.SOLANA_RPC_ENDPOINT;
      if (!rpcEndpoint) {
        return c.json({ error: 'Internal Server Error', message: 'Solana RPC endpoint not configured' }, 500);
      }

      const isConfirmed = await isTransactionConfirmed(rpcEndpoint, txSignature);
      if (!isConfirmed) {
        return c.json({ error: 'Bad Request', message: 'Transaction not confirmed' }, 400);
      }

      // Get transaction details
      const tx = await getTransaction(rpcEndpoint, txSignature);
      if (!tx) {
        return c.json({ error: 'Bad Request', message: 'Transaction not found' }, 404);
      }

      // Extract memo
      const memo = extractMemoFromTransaction(tx);
      if (!memo) {
        return c.json({ error: 'Bad Request', message: 'Transaction memo not found' }, 400);
      }

      // Find payment intent by memo
      const paymentIntent = await queryOne(
        c.env.DB,
        'SELECT * FROM PaymentIntent WHERE memo = ? AND merchantId = ? AND contentId = ? AND status = ?',
        [memo, merchantId, contentId, 'pending']
      );

      if (!paymentIntent) {
        return c.json({ error: 'Not Found', message: 'Payment intent not found' }, 404);
      }

      // Check if expired
      if (new Date(paymentIntent.expiresAt) < new Date()) {
        return c.json({ error: 'Bad Request', message: 'Payment intent expired' }, 400);
      }

      // Get payer wallet from transaction (first signer)
      // For versioned transactions, check message.staticAccountKeys
      // For legacy transactions, check transaction.message.accountKeys
      let payerWallet = 'unknown';
      try {
        if (tx.transaction?.message?.staticAccountKeys?.[0]) {
          payerWallet = tx.transaction.message.staticAccountKeys[0];
        } else if (tx.transaction?.message?.accountKeys?.[0]) {
          payerWallet = tx.transaction.message.accountKeys[0];
        } else if (tx.meta?.feePayer) {
          payerWallet = tx.meta.feePayer;
        }
      } catch {
        // Fallback to unknown
      }

      // Create payment record
      const paymentId = generateId();
      await execute(
        c.env.DB,
        `INSERT INTO Payment (id, paymentIntentId, merchantId, contentId, transactionSignature, payerWalletAddress, amount, currency, status, confirmedAt, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [paymentId, paymentIntent.id, merchantId, contentId, txSignature, payerWallet, paymentIntent.amount, paymentIntent.currency, 'confirmed']
      );

      // Update payment intent
      await execute(c.env.DB, 'UPDATE PaymentIntent SET status = ? WHERE id = ?', ['confirmed', paymentIntent.id]);

      // Create purchase
      const purchaseId = generateId();
      const expiresAt = paymentIntent.durationSecs
        ? new Date(Date.now() + paymentIntent.durationSecs * 1000).toISOString()
        : null;

      await execute(
        c.env.DB,
        `INSERT INTO Purchase (id, merchantId, contentId, paymentId, walletAddress, amount, currency, expiresAt, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [purchaseId, merchantId, contentId, paymentId, payerWallet, paymentIntent.amount, paymentIntent.currency, expiresAt]
      );

      // Create access token
      const tokenId = generateId();
      const accessToken = crypto.randomUUID() + crypto.randomUUID();
      await execute(
        c.env.DB,
        `INSERT INTO AccessToken (id, merchantId, contentId, paymentId, token, walletAddress, expiresAt, isRevoked, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
        [tokenId, merchantId, contentId, paymentId, accessToken, payerWallet, expiresAt]
      );

      // Send to queue for webhook processing
      try {
        await c.env.WEBHOOK_QUEUE.send({
          merchantId,
          eventType: 'payment.confirmed',
          paymentId,
          purchaseId,
        });
      } catch (error) {
        console.error('Failed to queue webhook:', error);
      }

      return c.json({
        status: 'confirmed',
        accessToken,
        paymentId,
      });
    } catch (error: any) {
      console.error('Verify payment error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get payment status (public, rate limited)
  app.get('/payments/payment-status', rateLimit({ limit: 30, window: 60 }), async (c) => {
    try {
      const txSignature = c.req.query('tx');

      if (!txSignature) {
        return c.json({ error: 'Bad Request', message: 'tx query parameter is required' }, 400);
      }

      const payment = await queryOne(
        c.env.DB,
        'SELECT * FROM Payment WHERE transactionSignature = ?',
        [txSignature]
      );

      if (!payment) {
        return c.json({ status: 'not_found', message: 'Payment not found' });
      }

      return c.json({
        status: payment.status,
        paymentId: payment.id,
        amount: payment.amount.toString(),
        currency: payment.currency,
        confirmedAt: payment.confirmedAt,
      });
    } catch (error: any) {
      console.error('Get payment status error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });
}

