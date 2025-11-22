-- Cloudflare D1 Database Schema
-- Converted from Prisma/PostgreSQL to SQLite/D1
-- 
-- Key differences:
-- - BIGINT → INTEGER
-- - JSON → TEXT (store as JSON string)
-- - Arrays → TEXT (comma-separated or JSON)
-- - TIMESTAMP → TEXT (ISO 8601 format)

-- ============================================================================
-- Merchant & Content Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS Merchant (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payoutAddress TEXT,
  webhookSecret TEXT,
  configJson TEXT,  -- JSON stored as TEXT
  
  -- Profile fields
  displayName TEXT,
  bio TEXT,
  avatarUrl TEXT,
  websiteUrl TEXT,
  twitterUrl TEXT,
  telegramUrl TEXT,
  discordUrl TEXT,
  githubUrl TEXT,
  
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_merchant_email ON Merchant(email);
CREATE INDEX idx_merchant_status ON Merchant(status);

CREATE TABLE IF NOT EXISTS Content (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  slug TEXT NOT NULL,
  priceLamports INTEGER NOT NULL,  -- BigInt → INTEGER
  currency TEXT NOT NULL DEFAULT 'SOL',
  durationSecs INTEGER,
  metadata TEXT,  -- JSON stored as TEXT
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  -- Discovery fields
  title TEXT,
  description TEXT,
  thumbnailUrl TEXT,
  category TEXT,
  tags TEXT,  -- Array stored as JSON string
  visibility TEXT NOT NULL DEFAULT 'private',
  canonicalUrl TEXT,
  previewText TEXT,
  
  -- Analytics
  viewCount INTEGER NOT NULL DEFAULT 0,
  purchaseCount INTEGER NOT NULL DEFAULT 0,
  
  UNIQUE(merchantId, slug),
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE
);

CREATE INDEX idx_content_merchant ON Content(merchantId);
CREATE INDEX idx_content_visibility ON Content(visibility);
CREATE INDEX idx_content_category ON Content(category);
CREATE INDEX idx_content_created ON Content(createdAt);

-- ============================================================================
-- Payment Flow
-- ============================================================================

CREATE TABLE IF NOT EXISTS PaymentIntent (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  contentId TEXT NOT NULL,
  amount INTEGER NOT NULL,  -- BigInt → INTEGER
  currency TEXT NOT NULL DEFAULT 'SOL',
  memo TEXT NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  recipientAddress TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE,
  FOREIGN KEY (contentId) REFERENCES Content(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_intent_merchant ON PaymentIntent(merchantId);
CREATE INDEX idx_payment_intent_content ON PaymentIntent(contentId);
CREATE INDEX idx_payment_intent_status ON PaymentIntent(status);
CREATE INDEX idx_payment_intent_nonce ON PaymentIntent(nonce);
CREATE INDEX idx_payment_intent_expires ON PaymentIntent(expiresAt);

CREATE TABLE IF NOT EXISTS Payment (
  id TEXT PRIMARY KEY,
  paymentIntentId TEXT NOT NULL UNIQUE,
  merchantId TEXT NOT NULL,
  contentId TEXT NOT NULL,
  transactionSignature TEXT NOT NULL UNIQUE,
  payerWalletAddress TEXT NOT NULL,
  amount INTEGER NOT NULL,  -- BigInt → INTEGER
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (paymentIntentId) REFERENCES PaymentIntent(id) ON DELETE CASCADE,
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE,
  FOREIGN KEY (contentId) REFERENCES Content(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_intent ON Payment(paymentIntentId);
CREATE INDEX idx_payment_merchant ON Payment(merchantId);
CREATE INDEX idx_payment_content ON Payment(contentId);
CREATE INDEX idx_payment_signature ON Payment(transactionSignature);
CREATE INDEX idx_payment_status ON Payment(status);
CREATE INDEX idx_payment_payer ON Payment(payerWalletAddress);

-- ============================================================================
-- Access Tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS AccessToken (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  contentId TEXT NOT NULL,
  paymentId TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  walletAddress TEXT NOT NULL,
  expiresAt TEXT,
  isRevoked INTEGER NOT NULL DEFAULT 0,  -- Boolean as INTEGER
  revokedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE,
  FOREIGN KEY (contentId) REFERENCES Content(id) ON DELETE CASCADE,
  FOREIGN KEY (paymentId) REFERENCES Payment(id) ON DELETE CASCADE
);

CREATE INDEX idx_access_token_token ON AccessToken(token);
CREATE INDEX idx_access_token_merchant ON AccessToken(merchantId);
CREATE INDEX idx_access_token_content ON AccessToken(contentId);
CREATE INDEX idx_access_token_wallet ON AccessToken(walletAddress);
CREATE INDEX idx_access_token_expires ON AccessToken(expiresAt);
CREATE INDEX idx_access_token_revoked ON AccessToken(isRevoked);

-- ============================================================================
-- Purchases
-- ============================================================================

CREATE TABLE IF NOT EXISTS Purchase (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  contentId TEXT NOT NULL,
  paymentId TEXT NOT NULL,
  walletAddress TEXT NOT NULL,
  amount INTEGER NOT NULL,  -- BigInt → INTEGER
  currency TEXT NOT NULL,
  expiresAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE,
  FOREIGN KEY (contentId) REFERENCES Content(id) ON DELETE CASCADE,
  FOREIGN KEY (paymentId) REFERENCES Payment(id) ON DELETE CASCADE
);

CREATE INDEX idx_purchase_merchant ON Purchase(merchantId);
CREATE INDEX idx_purchase_content ON Purchase(contentId);
CREATE INDEX idx_purchase_wallet ON Purchase(walletAddress);
CREATE INDEX idx_purchase_expires ON Purchase(expiresAt);

-- ============================================================================
-- Bookmarks
-- ============================================================================

CREATE TABLE IF NOT EXISTS Bookmark (
  id TEXT PRIMARY KEY,
  walletAddress TEXT NOT NULL,
  contentId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  UNIQUE(walletAddress, contentId),
  FOREIGN KEY (contentId) REFERENCES Content(id) ON DELETE CASCADE
);

CREATE INDEX idx_bookmark_wallet ON Bookmark(walletAddress);
CREATE INDEX idx_bookmark_content ON Bookmark(contentId);

-- ============================================================================
-- Merchant Follows
-- ============================================================================

CREATE TABLE IF NOT EXISTS MerchantFollow (
  id TEXT PRIMARY KEY,
  walletAddress TEXT NOT NULL,
  merchantId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  UNIQUE(walletAddress, merchantId),
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE
);

CREATE INDEX idx_follow_wallet ON MerchantFollow(walletAddress);
CREATE INDEX idx_follow_merchant ON MerchantFollow(merchantId);

-- ============================================================================
-- Referrals
-- ============================================================================

CREATE TABLE IF NOT EXISTS ReferralCode (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  discountPercentage INTEGER NOT NULL DEFAULT 0,
  maxUses INTEGER,
  currentUses INTEGER NOT NULL DEFAULT 0,
  expiresAt TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,  -- Boolean as INTEGER
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE
);

CREATE INDEX idx_referral_code_merchant ON ReferralCode(merchantId);
CREATE INDEX idx_referral_code_code ON ReferralCode(code);
CREATE INDEX idx_referral_code_active ON ReferralCode(isActive);

CREATE TABLE IF NOT EXISTS Referral (
  id TEXT PRIMARY KEY,
  referralCodeId TEXT NOT NULL,
  merchantId TEXT NOT NULL,
  referrerId TEXT NOT NULL,
  referredWalletAddress TEXT NOT NULL,
  purchaseId TEXT NOT NULL,
  discountApplied INTEGER NOT NULL DEFAULT 0,  -- Boolean as INTEGER
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (referralCodeId) REFERENCES ReferralCode(id) ON DELETE CASCADE,
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE,
  FOREIGN KEY (purchaseId) REFERENCES Purchase(id) ON DELETE CASCADE
);

CREATE INDEX idx_referral_code ON Referral(referralCodeId);
CREATE INDEX idx_referral_merchant ON Referral(merchantId);
CREATE INDEX idx_referral_referrer ON Referral(referrerId);

-- ============================================================================
-- API Keys
-- ============================================================================

CREATE TABLE IF NOT EXISTS ApiKey (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  name TEXT NOT NULL,
  keyHash TEXT NOT NULL UNIQUE,
  keyPrefix TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,  -- Boolean as INTEGER
  lastUsedAt TEXT,
  rateLimit INTEGER,
  allowedIps TEXT,  -- Array stored as JSON string
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  expiresAt TEXT,
  
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_key_merchant ON ApiKey(merchantId);
CREATE INDEX idx_api_key_hash ON ApiKey(keyHash);
CREATE INDEX idx_api_key_active ON ApiKey(isActive);

CREATE TABLE IF NOT EXISTS ApiKeyUsage (
  id TEXT PRIMARY KEY,
  apiKeyId TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  statusCode INTEGER NOT NULL,
  responseTime INTEGER,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (apiKeyId) REFERENCES ApiKey(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_usage_key ON ApiKeyUsage(apiKeyId);
CREATE INDEX idx_api_usage_created ON ApiKeyUsage(createdAt);
CREATE INDEX idx_api_usage_endpoint ON ApiKeyUsage(endpoint);

-- ============================================================================
-- Refund Requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS RefundRequest (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  paymentId TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  processedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE,
  FOREIGN KEY (paymentId) REFERENCES Payment(id) ON DELETE CASCADE
);

CREATE INDEX idx_refund_merchant ON RefundRequest(merchantId);
CREATE INDEX idx_refund_payment ON RefundRequest(paymentId);
CREATE INDEX idx_refund_status ON RefundRequest(status);

-- ============================================================================
-- Analytics & Events
-- ============================================================================

CREATE TABLE IF NOT EXISTS DashboardEvent (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  eventType TEXT NOT NULL,
  eventData TEXT,  -- JSON stored as TEXT
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE
);

CREATE INDEX idx_dashboard_event_merchant ON DashboardEvent(merchantId);
CREATE INDEX idx_dashboard_event_type ON DashboardEvent(eventType);
CREATE INDEX idx_dashboard_event_created ON DashboardEvent(createdAt);

CREATE TABLE IF NOT EXISTS LedgerEvent (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  paymentId TEXT NOT NULL,
  eventType TEXT NOT NULL,
  amount INTEGER NOT NULL,  -- BigInt → INTEGER
  currency TEXT NOT NULL,
  metadata TEXT,  -- JSON stored as TEXT
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (merchantId) REFERENCES Merchant(id) ON DELETE CASCADE,
  FOREIGN KEY (paymentId) REFERENCES Payment(id) ON DELETE CASCADE
);

CREATE INDEX idx_ledger_merchant ON LedgerEvent(merchantId);
CREATE INDEX idx_ledger_payment ON LedgerEvent(paymentId);
CREATE INDEX idx_ledger_type ON LedgerEvent(eventType);
CREATE INDEX idx_ledger_created ON LedgerEvent(createdAt);

