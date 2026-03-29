import type { Env } from '../types';
import type { Purchase } from '../types';
import type { Content } from '../types';
import type { Merchant } from '../types';
import { createWebhookDelivery } from './db';

function bufferToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return bufferToHex(sig);
}

export async function notifyPurchaseWebhook(
  env: Env,
  merchant: Merchant,
  purchase: Purchase,
  content: Content
): Promise<void> {
  const url = merchant.webhookUrl?.trim();
  const secret = merchant.webhookSecret?.trim();
  if (!url || !secret) return;

  const bodyObj = {
    type: 'purchase.confirmed',
    purchaseId: purchase.id,
    contentId: content.id,
    contentTitle: content.title,
    merchantId: merchant.id,
    amountSmallest: purchase.amountLamports,
    currency: purchase.currency,
    chain: purchase.chain ?? 'solana',
    transactionSignature: purchase.transactionSignature,
    payerAddress: purchase.payerAddress,
    confirmedAt: purchase.confirmedAt,
  };
  const body = JSON.stringify(bodyObj);
  const signature = await hmacSha256Hex(secret, body);

  const maxAttempts = 3;
  let lastHttp: number | null = null;
  let lastPreview = '';
  let ok = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Micropaywall-Signature': `sha256=${signature}`,
          'X-Micropaywall-Event': 'purchase.confirmed',
        },
        body,
      });
      lastHttp = res.status;
      const text = await res.text();
      lastPreview = text.slice(0, 500);
      if (res.ok) {
        ok = true;
        break;
      }
    } catch (e) {
      lastPreview = e instanceof Error ? e.message : 'fetch failed';
    }
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }

  await createWebhookDelivery(env.DB, {
    id: crypto.randomUUID(),
    merchantId: merchant.id,
    purchaseId: purchase.id,
    url,
    status: ok ? 'success' : 'failed',
    httpStatus: lastHttp,
    responsePreview: lastPreview || null,
    attempt: maxAttempts,
  });
}
