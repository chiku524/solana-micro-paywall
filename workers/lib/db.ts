import type { D1Database } from '@cloudflare/workers-types';
import type { Merchant, Content, PaymentIntent, Purchase, Bookmark } from '../types';

// Helper to convert SQLite row to typed object
function rowToMerchant(row: any): Merchant & { 
  passwordHash?: string;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiresAt?: number;
  failedLoginAttempts?: number;
  lockedUntil?: number;
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
} {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    payoutAddress: row.payout_address,
    webhookSecret: row.webhook_secret,
    twitterUrl: row.twitter_url,
    telegramUrl: row.telegram_url,
    discordUrl: row.discord_url,
    githubUrl: row.github_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    passwordHash: row.password_hash || undefined,
    emailVerified: row.email_verified === 1,
    emailVerificationToken: row.email_verification_token || undefined,
    passwordResetToken: row.password_reset_token || undefined,
    passwordResetExpiresAt: row.password_reset_expires_at || undefined,
    failedLoginAttempts: row.failed_login_attempts || 0,
    lockedUntil: row.locked_until || undefined,
    twoFactorSecret: row.two_factor_secret || undefined,
    twoFactorEnabled: row.two_factor_enabled === 1,
  };
}

function rowToContent(row: any): Content {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    tags: row.tags,
    thumbnailUrl: row.thumbnail_url,
    priceLamports: row.price_lamports,
    currency: row.currency,
    durationSeconds: row.duration_seconds,
    visibility: row.visibility,
    previewText: row.preview_text,
    canonicalUrl: row.canonical_url,
    viewCount: row.view_count,
    purchaseCount: row.purchase_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPaymentIntent(row: any): PaymentIntent {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    contentId: row.content_id,
    amountLamports: row.amount_lamports,
    currency: row.currency,
    nonce: row.nonce,
    memo: row.memo,
    payerAddress: row.payer_address,
    transactionSignature: row.transaction_signature,
    status: row.status,
    expiresAt: row.expires_at,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  };
}

function rowToPurchase(row: any): Purchase {
  return {
    id: row.id,
    paymentIntentId: row.payment_intent_id,
    merchantId: row.merchant_id,
    contentId: row.content_id,
    payerAddress: row.payer_address,
    amountLamports: row.amount_lamports,
    currency: row.currency,
    transactionSignature: row.transaction_signature,
    accessToken: row.access_token,
    expiresAt: row.expires_at,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  };
}

function rowToBookmark(row: any): Bookmark {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    contentId: row.content_id,
    createdAt: row.created_at,
  };
}

// Merchant queries
export async function getMerchantById(db: D1Database, id: string): Promise<(Merchant & { passwordHash?: string }) | null> {
  const result = await db.prepare('SELECT * FROM merchants WHERE id = ?').bind(id).first();
  return result ? rowToMerchant(result) : null;
}

export async function getMerchantByEmail(db: D1Database, email: string): Promise<(Merchant & { passwordHash?: string }) | null> {
  const result = await db.prepare('SELECT * FROM merchants WHERE email = ?').bind(email).first();
  return result ? rowToMerchant(result) : null;
}

export async function createMerchant(db: D1Database, data: {
  id: string;
  email: string;
  passwordHash: string;
  payoutAddress?: string;
}): Promise<Merchant> {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'INSERT INTO merchants (id, email, password_hash, payout_address, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(data.id, data.email, data.passwordHash, data.payoutAddress || null, 'active', now, now)
    .run();
  
  const merchant = await getMerchantById(db, data.id);
  if (!merchant) throw new Error('Failed to create merchant');
  // Remove passwordHash from returned merchant object for security
  const { passwordHash, ...merchantWithoutPassword } = merchant;
  return merchantWithoutPassword;
}

export async function updateMerchant(db: D1Database, id: string, data: Partial<Merchant>): Promise<Merchant> {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.displayName !== undefined) { updates.push('display_name = ?'); values.push(data.displayName); }
  if (data.bio !== undefined) { updates.push('bio = ?'); values.push(data.bio); }
  if (data.avatarUrl !== undefined) { updates.push('avatar_url = ?'); values.push(data.avatarUrl); }
  if (data.payoutAddress !== undefined) { updates.push('payout_address = ?'); values.push(data.payoutAddress); }
  if (data.webhookSecret !== undefined) { updates.push('webhook_secret = ?'); values.push(data.webhookSecret); }
  if (data.twitterUrl !== undefined) { updates.push('twitter_url = ?'); values.push(data.twitterUrl); }
  if (data.telegramUrl !== undefined) { updates.push('telegram_url = ?'); values.push(data.telegramUrl); }
  if (data.discordUrl !== undefined) { updates.push('discord_url = ?'); values.push(data.discordUrl); }
  if (data.githubUrl !== undefined) { updates.push('github_url = ?'); values.push(data.githubUrl); }
  
  if (updates.length === 0) {
    return await getMerchantById(db, id) as Merchant;
  }
  
  const now = Math.floor(Date.now() / 1000);
  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  await db.prepare(`UPDATE merchants SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  return await getMerchantById(db, id) as Merchant;
}

// Security-related merchant functions
export async function updateMerchantPassword(db: D1Database, id: string, passwordHash: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'UPDATE merchants SET password_hash = ?, password_reset_token = NULL, password_reset_expires_at = NULL, updated_at = ? WHERE id = ?'
  ).bind(passwordHash, now, id).run();
}

export async function setPasswordResetToken(db: D1Database, email: string, token: string, expiresAt: number): Promise<void> {
  await db.prepare(
    'UPDATE merchants SET password_reset_token = ?, password_reset_expires_at = ? WHERE email = ?'
  ).bind(token, expiresAt, email).run();
}

export async function getMerchantByPasswordResetToken(db: D1Database, token: string): Promise<(Merchant & { passwordHash?: string }) | null> {
  const result = await db.prepare('SELECT * FROM merchants WHERE password_reset_token = ?').bind(token).first();
  return result ? rowToMerchant(result) : null;
}

export async function getMerchantByEmailVerificationToken(db: D1Database, token: string): Promise<(Merchant & { passwordHash?: string }) | null> {
  const result = await db.prepare('SELECT * FROM merchants WHERE email_verification_token = ?').bind(token).first();
  return result ? rowToMerchant(result) : null;
}

export async function setEmailVerificationToken(db: D1Database, id: string, token: string): Promise<void> {
  await db.prepare('UPDATE merchants SET email_verification_token = ? WHERE id = ?').bind(token, id).run();
}

export async function verifyEmail(db: D1Database, id: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'UPDATE merchants SET email_verified = 1, email_verification_token = NULL, updated_at = ? WHERE id = ?'
  ).bind(now, id).run();
}

export async function updateFailedLoginAttempts(
  db: D1Database, 
  id: string, 
  failedAttempts: number, 
  lockedUntil: number | null
): Promise<void> {
  await db.prepare(
    'UPDATE merchants SET failed_login_attempts = ?, locked_until = ? WHERE id = ?'
  ).bind(failedAttempts, lockedUntil, id).run();
}

export async function setTwoFactorSecret(db: D1Database, id: string, secret: string, enabled: boolean): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'UPDATE merchants SET two_factor_secret = ?, two_factor_enabled = ?, updated_at = ? WHERE id = ?'
  ).bind(secret, enabled ? 1 : 0, now, id).run();
}

// Content queries
export async function getContentById(db: D1Database, id: string): Promise<Content | null> {
  const result = await db.prepare('SELECT * FROM content WHERE id = ?').bind(id).first();
  return result ? rowToContent(result) : null;
}

export async function getContentBySlug(db: D1Database, merchantId: string, slug: string): Promise<Content | null> {
  const result = await db.prepare('SELECT * FROM content WHERE merchant_id = ? AND slug = ?')
    .bind(merchantId, slug).first();
  return result ? rowToContent(result) : null;
}

export async function listContentByMerchant(db: D1Database, merchantId: string, limit = 100, offset = 0): Promise<Content[]> {
  const results = await db.prepare('SELECT * FROM content WHERE merchant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(merchantId, limit, offset).all();
  return results.results.map(rowToContent);
}

export async function createContent(db: D1Database, data: {
  id: string;
  merchantId: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string;
  thumbnailUrl?: string;
  priceLamports: number;
  currency?: string;
  durationSeconds?: number;
  visibility?: string;
  previewText?: string;
  canonicalUrl?: string;
}): Promise<Content> {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    `INSERT INTO content (
      id, merchant_id, slug, title, description, category, tags, thumbnail_url,
      price_lamports, currency, duration_seconds, visibility, preview_text,
      canonical_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      data.id,
      data.merchantId,
      data.slug,
      data.title,
      data.description || null,
      data.category || null,
      data.tags || null,
      data.thumbnailUrl || null,
      data.priceLamports,
      data.currency || 'SOL',
      data.durationSeconds || null,
      data.visibility || 'public',
      data.previewText || null,
      data.canonicalUrl || null,
      now,
      now
    )
    .run();
  
  const content = await getContentById(db, data.id);
  if (!content) throw new Error('Failed to create content');
  return content;
}

export async function updateContent(db: D1Database, id: string, data: Partial<Content>): Promise<Content> {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.slug !== undefined) { updates.push('slug = ?'); values.push(data.slug); }
  if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
  if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category); }
  if (data.tags !== undefined) { updates.push('tags = ?'); values.push(data.tags); }
  if (data.thumbnailUrl !== undefined) { updates.push('thumbnail_url = ?'); values.push(data.thumbnailUrl); }
  if (data.priceLamports !== undefined) { updates.push('price_lamports = ?'); values.push(data.priceLamports); }
  if (data.currency !== undefined) { updates.push('currency = ?'); values.push(data.currency); }
  if (data.durationSeconds !== undefined) { updates.push('duration_seconds = ?'); values.push(data.durationSeconds); }
  if (data.visibility !== undefined) { updates.push('visibility = ?'); values.push(data.visibility); }
  if (data.previewText !== undefined) { updates.push('preview_text = ?'); values.push(data.previewText); }
  if (data.canonicalUrl !== undefined) { updates.push('canonical_url = ?'); values.push(data.canonicalUrl); }
  
  if (updates.length === 0) {
    return await getContentById(db, id) as Content;
  }
  
  const now = Math.floor(Date.now() / 1000);
  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  await db.prepare(`UPDATE content SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  return await getContentById(db, id) as Content;
}

export async function deleteContent(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM content WHERE id = ?').bind(id).run();
}

export async function incrementContentViewCount(db: D1Database, id: string): Promise<void> {
  await db.prepare('UPDATE content SET view_count = view_count + 1 WHERE id = ?').bind(id).run();
}

export async function incrementContentPurchaseCount(db: D1Database, id: string): Promise<void> {
  await db.prepare('UPDATE content SET purchase_count = purchase_count + 1 WHERE id = ?').bind(id).run();
}

// Payment Intent queries
export async function getPaymentIntentById(db: D1Database, id: string): Promise<PaymentIntent | null> {
  const result = await db.prepare('SELECT * FROM payment_intents WHERE id = ?').bind(id).first();
  return result ? rowToPaymentIntent(result) : null;
}

export async function getPaymentIntentByNonce(db: D1Database, nonce: string): Promise<PaymentIntent | null> {
  const result = await db.prepare('SELECT * FROM payment_intents WHERE nonce = ?').bind(nonce).first();
  return result ? rowToPaymentIntent(result) : null;
}

export async function createPaymentIntent(db: D1Database, data: {
  id: string;
  merchantId: string;
  contentId: string;
  amountLamports: number;
  currency?: string;
  nonce: string;
  memo?: string;
  expiresAt: number;
}): Promise<PaymentIntent> {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    `INSERT INTO payment_intents (
      id, merchant_id, content_id, amount_lamports, currency, nonce, memo, expires_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      data.id,
      data.merchantId,
      data.contentId,
      data.amountLamports,
      data.currency || 'SOL',
      data.nonce,
      data.memo || null,
      data.expiresAt,
      now
    )
    .run();
  
  const intent = await getPaymentIntentById(db, data.id);
  if (!intent) throw new Error('Failed to create payment intent');
  return intent;
}

export async function updatePaymentIntent(db: D1Database, id: string, data: {
  status?: PaymentIntent['status'];
  payerAddress?: string;
  transactionSignature?: string;
  confirmedAt?: number;
}): Promise<PaymentIntent> {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }
  if (data.payerAddress !== undefined) { updates.push('payer_address = ?'); values.push(data.payerAddress); }
  if (data.transactionSignature !== undefined) { updates.push('transaction_signature = ?'); values.push(data.transactionSignature); }
  if (data.confirmedAt !== undefined) { updates.push('confirmed_at = ?'); values.push(data.confirmedAt); }
  
  if (updates.length === 0) {
    return await getPaymentIntentById(db, id) as PaymentIntent;
  }
  
  values.push(id);
  await db.prepare(`UPDATE payment_intents SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  return await getPaymentIntentById(db, id) as PaymentIntent;
}

// Purchase queries
export async function getPurchaseById(db: D1Database, id: string): Promise<Purchase | null> {
  const result = await db.prepare('SELECT * FROM purchases WHERE id = ?').bind(id).first();
  return result ? rowToPurchase(result) : null;
}

export async function getPurchaseByAccessToken(db: D1Database, accessToken: string): Promise<Purchase | null> {
  const result = await db.prepare('SELECT * FROM purchases WHERE access_token = ?').bind(accessToken).first();
  return result ? rowToPurchase(result) : null;
}

export async function getPurchaseByTransactionSignature(db: D1Database, signature: string): Promise<Purchase | null> {
  const result = await db.prepare('SELECT * FROM purchases WHERE transaction_signature = ?').bind(signature).first();
  return result ? rowToPurchase(result) : null;
}

export async function getPurchasesByWallet(db: D1Database, walletAddress: string, limit = 100, offset = 0): Promise<Purchase[]> {
  const results = await db.prepare('SELECT * FROM purchases WHERE payer_address = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(walletAddress, limit, offset).all();
  return results.results.map(rowToPurchase);
}

export async function getPurchasesByContent(db: D1Database, contentId: string, limit = 100, offset = 0): Promise<Purchase[]> {
  const results = await db.prepare('SELECT * FROM purchases WHERE content_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(contentId, limit, offset).all();
  return results.results.map(rowToPurchase);
}

export async function getPurchasesByMerchant(db: D1Database, merchantId: string, limit = 100, offset = 0): Promise<Purchase[]> {
  const results = await db.prepare('SELECT * FROM purchases WHERE merchant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(merchantId, limit, offset).all();
  return results.results.map(rowToPurchase);
}

export async function createPurchase(db: D1Database, data: {
  id: string;
  paymentIntentId: string;
  merchantId: string;
  contentId: string;
  payerAddress: string;
  amountLamports: number;
  currency?: string;
  transactionSignature: string;
  accessToken: string;
  expiresAt?: number;
}): Promise<Purchase> {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    `INSERT INTO purchases (
      id, payment_intent_id, merchant_id, content_id, payer_address, amount_lamports,
      currency, transaction_signature, access_token, expires_at, confirmed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      data.id,
      data.paymentIntentId,
      data.merchantId,
      data.contentId,
      data.payerAddress,
      data.amountLamports,
      data.currency || 'SOL',
      data.transactionSignature,
      data.accessToken,
      data.expiresAt || null,
      now,
      now
    )
    .run();
  
  const purchase = await getPurchaseById(db, data.id);
  if (!purchase) throw new Error('Failed to create purchase');
  return purchase;
}

// Bookmark queries
export async function getBookmark(db: D1Database, walletAddress: string, contentId: string): Promise<Bookmark | null> {
  const result = await db.prepare('SELECT * FROM bookmarks WHERE wallet_address = ? AND content_id = ?')
    .bind(walletAddress, contentId).first();
  return result ? rowToBookmark(result) : null;
}

export async function getBookmarksByWallet(db: D1Database, walletAddress: string, limit = 100, offset = 0): Promise<Bookmark[]> {
  const results = await db.prepare('SELECT * FROM bookmarks WHERE wallet_address = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(walletAddress, limit, offset).all();
  return results.results.map(rowToBookmark);
}

export async function createBookmark(db: D1Database, walletAddress: string, contentId: string): Promise<Bookmark> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare('INSERT INTO bookmarks (id, wallet_address, content_id, created_at) VALUES (?, ?, ?, ?)')
    .bind(id, walletAddress, contentId, now).run();
  
  const bookmark = await getBookmark(db, walletAddress, contentId);
  if (!bookmark) throw new Error('Failed to create bookmark');
  return bookmark;
}

export async function deleteBookmark(db: D1Database, walletAddress: string, contentId: string): Promise<void> {
  await db.prepare('DELETE FROM bookmarks WHERE wallet_address = ? AND content_id = ?')
    .bind(walletAddress, contentId).run();
}
