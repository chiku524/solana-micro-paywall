-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  payout_address TEXT,
  webhook_secret TEXT,
  twitter_url TEXT,
  telegram_url TEXT,
  discord_url TEXT,
  github_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'suspended')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_merchants_email ON merchants(email);
CREATE INDEX idx_merchants_status ON merchants(status);

-- Content table
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT,
  thumbnail_url TEXT,
  price_lamports INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SOL',
  duration_seconds INTEGER,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public', 'private')),
  preview_text TEXT,
  canonical_url TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  purchase_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  UNIQUE(merchant_id, slug)
);

CREATE INDEX idx_content_merchant_id ON content(merchant_id);
CREATE INDEX idx_content_slug ON content(slug);
CREATE INDEX idx_content_visibility ON content(visibility);
CREATE INDEX idx_content_category ON content(category);

-- Payment Intents table
CREATE TABLE IF NOT EXISTS payment_intents (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  amount_lamports INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SOL',
  nonce TEXT NOT NULL UNIQUE,
  memo TEXT,
  payer_address TEXT,
  transaction_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'failed', 'expired', 'refunded')),
  expires_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_intents_merchant_id ON payment_intents(merchant_id);
CREATE INDEX idx_payment_intents_content_id ON payment_intents(content_id);
CREATE INDEX idx_payment_intents_nonce ON payment_intents(nonce);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_payment_intents_payer_address ON payment_intents(payer_address);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  payment_intent_id TEXT NOT NULL,
  merchant_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  payer_address TEXT NOT NULL,
  amount_lamports INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SOL',
  transaction_signature TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL UNIQUE,
  expires_at INTEGER,
  confirmed_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
);

CREATE INDEX idx_purchases_merchant_id ON purchases(merchant_id);
CREATE INDEX idx_purchases_content_id ON purchases(content_id);
CREATE INDEX idx_purchases_payer_address ON purchases(payer_address);
CREATE INDEX idx_purchases_transaction_signature ON purchases(transaction_signature);
CREATE INDEX idx_purchases_access_token ON purchases(access_token);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  content_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
  UNIQUE(wallet_address, content_id)
);

CREATE INDEX idx_bookmarks_wallet_address ON bookmarks(wallet_address);
CREATE INDEX idx_bookmarks_content_id ON bookmarks(content_id);
