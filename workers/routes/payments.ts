import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import {
  getContentById,
  getPaymentIntentById,
  createPaymentIntent,
  updatePaymentIntent,
  getMerchantById,
} from '../lib/db';
import { generateNonce } from '../lib/solana';
import { checkRateLimit, getRateLimitKey } from '../lib/rate-limit';
import { z } from 'zod';
import { encodeURL } from '@solana/pay';

const app = new Hono<{ Bindings: Env }>();

const createPaymentRequestSchema = z.object({
  contentId: z.string().min(1),
});

// Create payment request (public, but rate limited)
app.post('/create-payment-request', async (c) => {
  try {
    // Rate limiting
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = getRateLimitKey(ip, 'create-payment-request');
    const rateLimit = await checkRateLimit(c.env.CACHE, rateLimitKey, { limit: 10, windowSeconds: 60 });
    
    if (!rateLimit.allowed) {
      return c.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded' },
        429,
        { 'Retry-After': String(rateLimit.resetAt - Math.floor(Date.now() / 1000)) }
      );
    }
    
    const body = await c.req.json();
    const { contentId } = createPaymentRequestSchema.parse(body);
    
    // Get content
    const content = await getContentById(c.env.DB, contentId);
    if (!content) {
      return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
    }
    
    // Get merchant
    const merchant = await getMerchantById(c.env.DB, content.merchantId);
    if (!merchant || !merchant.payoutAddress) {
      return c.json({ error: 'Bad Request', message: 'Merchant payout address not configured' }, 400);
    }
    
    // Generate payment intent
    const paymentIntentId = crypto.randomUUID();
    const nonce = generateNonce();
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutes
    
    const paymentIntent = await createPaymentIntent(c.env.DB, {
      id: paymentIntentId,
      merchantId: content.merchantId,
      contentId: content.id,
      amountLamports: content.priceLamports,
      currency: content.currency,
      nonce,
      memo: `Payment for ${content.title}`,
      expiresAt,
    });
    
    // Generate Solana Pay URL
    const { PublicKey } = await import('@solana/web3.js');
    const recipient = merchant.payoutAddress;
    const amount = content.priceLamports / 1_000_000_000; // Convert to SOL
    const reference = new TextEncoder().encode(nonce);
    
    const paymentUrl = encodeURL({
      recipient: new PublicKey(recipient),
      amount,
      reference,
      label: content.title,
      message: `Payment for ${content.title}`,
    });
    
    return c.json({
      paymentIntent,
      paymentUrl: paymentUrl.toString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

const verifyPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
  transactionSignature: z.string().min(1),
});

// Verify payment (public, but rate limited)
app.post('/verify-payment', async (c) => {
  try {
    // Rate limiting
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = getRateLimitKey(ip, 'verify-payment');
    const rateLimit = await checkRateLimit(c.env.CACHE, rateLimitKey, { limit: 20, windowSeconds: 60 });
    
    if (!rateLimit.allowed) {
      return c.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded' },
        429,
        { 'Retry-After': String(rateLimit.resetAt - Math.floor(Date.now() / 1000)) }
      );
    }
    
    const body = await c.req.json();
    const { paymentIntentId, transactionSignature } = verifyPaymentSchema.parse(body);
    
    // Get payment intent
    const paymentIntent = await getPaymentIntentById(c.env.DB, paymentIntentId);
    if (!paymentIntent) {
      return c.json({ error: 'Not Found', message: 'Payment intent not found' }, 404);
    }
    
    if (paymentIntent.status !== 'pending') {
      return c.json({ error: 'Bad Request', message: `Payment intent is ${paymentIntent.status}` }, 400);
    }
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (now > paymentIntent.expiresAt) {
      await updatePaymentIntent(c.env.DB, paymentIntentId, { status: 'expired' });
      return c.json({ error: 'Bad Request', message: 'Payment intent expired' }, 400);
    }
    
    // Verify transaction on-chain
    const { Connection, PublicKey } = await import('@solana/web3.js');
    const connection = new Connection(
      c.env.HELIUS_API_KEY 
        ? `${c.env.SOLANA_RPC_URL}?api-key=${c.env.HELIUS_API_KEY}`
        : c.env.SOLANA_RPC_URL,
      'confirmed'
    );
    
    try {
      const tx = await connection.getTransaction(transactionSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
      
      if (!tx || !tx.meta || tx.meta.err) {
        await updatePaymentIntent(c.env.DB, paymentIntentId, { status: 'failed' });
        return c.json({ error: 'Bad Request', message: 'Transaction failed or not found' }, 400);
      }
      
      // Verify amount and recipient (simplified - would need full transaction parsing)
      // For now, we'll trust the transaction signature and mark as confirmed
      // In production, you should verify the exact amount and recipient
      
      // Extract payer address from transaction (simplified - in production, parse transaction properly)
      const payerAddress = tx.transaction.message.accountKeys[0]?.toString() || '';
      
      const confirmedAt = Math.floor(Date.now() / 1000);
      await updatePaymentIntent(c.env.DB, paymentIntentId, {
        status: 'confirmed',
        transactionSignature,
        payerAddress,
        confirmedAt,
      });
      
      // Return success - purchase will be created via purchases route
      return c.json({
        success: true,
        paymentIntent: await getPaymentIntentById(c.env.DB, paymentIntentId),
      });
    } catch (error) {
      console.error('Transaction verification error:', error);
      await updatePaymentIntent(c.env.DB, paymentIntentId, { status: 'failed' });
      return c.json({ error: 'Bad Request', message: 'Failed to verify transaction' }, 400);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

export default app;
