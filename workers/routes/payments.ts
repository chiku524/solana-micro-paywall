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
import { getVerifier } from '../lib/verifiers';
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
    
    const chain = content.chain ?? 'solana';
    
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
      chain,
    });
    
    const recipient = merchant.payoutAddress;
    
    if (chain === 'solana') {
      // Generate Solana Pay URL
      const { PublicKey } = await import('@solana/web3.js');
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
        recipientAddress: recipient,
        chain: 'solana',
      });
    }
    
    // EVM chains: return structured payment data for wallet to build tx
    const EVM_CHAIN_IDS: Record<string, number> = {
      ethereum: 1, polygon: 137, base: 8453, arbitrum: 42161,
      optimism: 10, bnb: 56, avalanche: 43114,
    };
    const chainId = EVM_CHAIN_IDS[chain] ?? 1;
    
    return c.json({
      paymentIntent,
      paymentUrl: `ethereum:${recipient}@${chainId}/transfer?value=${content.priceLamports}`,
      recipientAddress: recipient,
      chain,
      chainId,
      amountWei: content.priceLamports,
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
    
    // Verify transaction on-chain (chain-agnostic; add new chains in workers/lib/verifiers)
    try {
      const merchant = await getMerchantById(c.env.DB, paymentIntent.merchantId);
      if (!merchant || !merchant.payoutAddress) {
        return c.json({ error: 'Bad Request', message: 'Merchant payout address not configured' }, 400);
      }

      const chain = (paymentIntent as { chain?: string }).chain ?? 'solana';
      const verifier = getVerifier(chain);
      const verification = await verifier.verify(
        c.env,
        transactionSignature,
        merchant.payoutAddress,
        paymentIntent.amountLamports,
        paymentIntent.memo || undefined
      );
      
      if (!verification.valid) {
        await updatePaymentIntent(c.env.DB, paymentIntentId, { status: 'failed' });
        return c.json({ 
          error: 'Bad Request', 
          message: verification.error || 'Transaction verification failed' 
        }, 400);
      }
      
      if (!verification.payerAddress) {
        await updatePaymentIntent(c.env.DB, paymentIntentId, { status: 'failed' });
        return c.json({ error: 'Bad Request', message: 'Could not determine payer address' }, 400);
      }
      
      const confirmedAt = Math.floor(Date.now() / 1000);
      await updatePaymentIntent(c.env.DB, paymentIntentId, {
        status: 'confirmed',
        transactionSignature,
        payerAddress: verification.payerAddress,
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
