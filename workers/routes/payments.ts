import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env } from '../types';
import type { Content } from '../types';
import type { Merchant } from '../types';
import type { PaymentIntent } from '../types';
import {
  getContentById,
  getPaymentIntentById,
  createPaymentIntent,
  updatePaymentIntent,
  getMerchantById,
  getPaymentIntentByIdempotencyKey,
  getMerchantApiKeyByHash,
  touchMerchantApiKeyLastUsed,
} from '../lib/db';
import { generateNonce } from '../lib/solana';
import { checkRateLimit, getRateLimitKey } from '../lib/rate-limit';
import { getVerifier } from '../lib/verifiers';
import { z } from 'zod';
import { encodeURL } from '@solana/pay';
import { convertUsdToNativeSmallestUnits } from '../lib/fiat-quote';
import { sha256Hex } from '../lib/api-key-crypto';

const app = new Hono<{ Bindings: Env }>();

const createPaymentRequestSchema = z.object({
  contentId: z.string().min(1),
});

const EVM_CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  polygon: 137,
  base: 8453,
  arbitrum: 42161,
  optimism: 10,
  bnb: 56,
  avalanche: 43114,
};

async function buildPaymentRequestPayload(
  content: Content,
  merchant: Merchant,
  paymentIntent: PaymentIntent,
  quotedFromUsd: boolean
): Promise<Record<string, unknown>> {
  const chain = paymentIntent.chain ?? 'solana';
  const recipient = merchant.payoutAddress as string;

  if (chain === 'solana') {
    const { PublicKey } = await import('@solana/web3.js');
    const amount = paymentIntent.amountLamports / 1_000_000_000;
    const reference = new TextEncoder().encode(paymentIntent.nonce);
    const paymentUrl = encodeURL({
      recipient: new PublicKey(recipient),
      amount,
      reference,
      label: content.title,
      message: paymentIntent.memo || `Payment for ${content.title}`,
    });
    return {
      paymentIntent,
      paymentUrl: paymentUrl.toString(),
      recipientAddress: recipient,
      chain: 'solana',
      ...(quotedFromUsd ? { quotedFromUsd: true as const } : {}),
    };
  }

  const chainId = EVM_CHAIN_IDS[chain] ?? 1;
  return {
    paymentIntent,
    paymentUrl: `ethereum:${recipient}@${chainId}/transfer?value=${paymentIntent.amountLamports}`,
    recipientAddress: recipient,
    chain,
    chainId,
    amountWei: paymentIntent.amountLamports,
    ...(quotedFromUsd ? { quotedFromUsd: true as const } : {}),
  };
}

function applyRateLimitHeaders(c: Context, remaining: number, resetAt: number) {
  c.header('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  c.header('X-RateLimit-Reset', String(resetAt));
}

async function resolveApiKeyClient(
  env: Env,
  header: string | undefined,
  ip: string
): Promise<{ rateId: string; hasApiKey: boolean }> {
  const trimmed = header?.trim();
  if (!trimmed) return { rateId: ip, hasApiKey: false };
  const keyHash = await sha256Hex(trimmed);
  const row = await getMerchantApiKeyByHash(env.DB, keyHash);
  if (!row) return { rateId: ip, hasApiKey: false };
  await touchMerchantApiKeyLastUsed(env.DB, row.id);
  return { rateId: `ak:${keyHash}`, hasApiKey: true };
}

// Create payment request (public, but rate limited; optional X-Api-Key for higher limits)
app.post('/create-payment-request', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const { rateId, hasApiKey } = await resolveApiKeyClient(c.env, c.req.header('X-Api-Key'), ip);
    const limit = hasApiKey ? 100 : 10;
    const rateLimitKey = getRateLimitKey(rateId, 'create-payment-request');
    const rateLimit = await checkRateLimit(c.env.CACHE, rateLimitKey, { limit, windowSeconds: 60 });

    if (!rateLimit.allowed) {
      applyRateLimitHeaders(c, rateLimit.remaining, rateLimit.resetAt);
      return c.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded' },
        429,
        { 'Retry-After': String(rateLimit.resetAt - Math.floor(Date.now() / 1000)) }
      );
    }
    applyRateLimitHeaders(c, rateLimit.remaining, rateLimit.resetAt);

    const body = await c.req.json();
    const { contentId } = createPaymentRequestSchema.parse(body);

    const content = await getContentById(c.env.DB, contentId);
    if (!content) {
      return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
    }

    const merchant = await getMerchantById(c.env.DB, content.merchantId);
    if (!merchant || !merchant.payoutAddress) {
      return c.json({ error: 'Bad Request', message: 'Merchant payout address not configured' }, 400);
    }

    const chain = content.chain ?? 'solana';
    const now = Math.floor(Date.now() / 1000);
    const idemRaw = c.req.header('Idempotency-Key')?.trim();
    const idempotencyKey =
      idemRaw && idemRaw.length >= 8 && idemRaw.length <= 200 ? idemRaw : undefined;

    if (idempotencyKey && c.env.CACHE) {
      const cachedIntentId = await c.env.CACHE.get(`pay:idem:${idempotencyKey}`);
      if (cachedIntentId) {
        const existingIntent = await getPaymentIntentById(c.env.DB, cachedIntentId);
        if (
          existingIntent &&
          existingIntent.status === 'pending' &&
          now < existingIntent.expiresAt &&
          existingIntent.contentId === contentId
        ) {
          const payload = await buildPaymentRequestPayload(content, merchant, existingIntent, false);
          return c.json(payload);
        }
      }
      const existingByDb = await getPaymentIntentByIdempotencyKey(c.env.DB, idempotencyKey);
      if (
        existingByDb &&
        existingByDb.status === 'pending' &&
        now < existingByDb.expiresAt &&
        existingByDb.contentId === contentId
      ) {
        const ttl = Math.max(60, existingByDb.expiresAt - now);
        await c.env.CACHE.put(`pay:idem:${idempotencyKey}`, existingByDb.id, { expirationTtl: ttl });
        const payload = await buildPaymentRequestPayload(content, merchant, existingByDb, false);
        return c.json(payload);
      }
    }

    let amountLamports = content.priceLamports;
    let quotedFromUsd = false;
    if (content.targetPriceUsd != null && content.targetPriceUsd > 0) {
      const { amountSmallest } = await convertUsdToNativeSmallestUnits(c.env, chain, content.targetPriceUsd);
      amountLamports = amountSmallest;
      quotedFromUsd = true;
    }

    const paymentIntentId = crypto.randomUUID();
    const nonce = generateNonce();
    const expiresAt = now + 15 * 60;
    const memo = `Payment for ${content.title}`;

    let paymentIntent: PaymentIntent;
    try {
      paymentIntent = await createPaymentIntent(c.env.DB, {
        id: paymentIntentId,
        merchantId: content.merchantId,
        contentId: content.id,
        amountLamports,
        currency: content.currency,
        nonce,
        memo,
        expiresAt,
        chain,
        idempotencyKey,
      });
    } catch {
      if (idempotencyKey) {
        const fallback = await getPaymentIntentByIdempotencyKey(c.env.DB, idempotencyKey);
        if (
          fallback &&
          fallback.status === 'pending' &&
          now < fallback.expiresAt &&
          fallback.contentId === contentId
        ) {
          const payload = await buildPaymentRequestPayload(content, merchant, fallback, false);
          return c.json(payload);
        }
      }
      throw new Error('Failed to create payment intent');
    }

    if (idempotencyKey && c.env.CACHE) {
      await c.env.CACHE.put(`pay:idem:${idempotencyKey}`, paymentIntent.id, { expirationTtl: 900 });
    }

    const payload = await buildPaymentRequestPayload(content, merchant, paymentIntent, quotedFromUsd);
    return c.json(payload);
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

app.post('/verify-payment', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const { rateId, hasApiKey } = await resolveApiKeyClient(c.env, c.req.header('X-Api-Key'), ip);
    const limit = hasApiKey ? 200 : 20;
    const rateLimitKey = getRateLimitKey(rateId, 'verify-payment');
    const rateLimit = await checkRateLimit(c.env.CACHE, rateLimitKey, { limit, windowSeconds: 60 });

    if (!rateLimit.allowed) {
      applyRateLimitHeaders(c, rateLimit.remaining, rateLimit.resetAt);
      return c.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded' },
        429,
        { 'Retry-After': String(rateLimit.resetAt - Math.floor(Date.now() / 1000)) }
      );
    }
    applyRateLimitHeaders(c, rateLimit.remaining, rateLimit.resetAt);

    const body = await c.req.json();
    const { paymentIntentId, transactionSignature } = verifyPaymentSchema.parse(body);

    const paymentIntent = await getPaymentIntentById(c.env.DB, paymentIntentId);
    if (!paymentIntent) {
      return c.json({ error: 'Not Found', message: 'Payment intent not found' }, 404);
    }

    if (paymentIntent.status !== 'pending') {
      return c.json({ error: 'Bad Request', message: `Payment intent is ${paymentIntent.status}` }, 400);
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > paymentIntent.expiresAt) {
      await updatePaymentIntent(c.env.DB, paymentIntentId, { status: 'expired' });
      return c.json({ error: 'Bad Request', message: 'Payment intent expired' }, 400);
    }

    try {
      const merchant = await getMerchantById(c.env.DB, paymentIntent.merchantId);
      if (!merchant || !merchant.payoutAddress) {
        return c.json({ error: 'Bad Request', message: 'Merchant payout address not configured' }, 400);
      }

      const chain = paymentIntent.chain ?? 'solana';
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
        return c.json(
          {
            error: 'Bad Request',
            message: verification.error || 'Transaction verification failed',
          },
          400
        );
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
