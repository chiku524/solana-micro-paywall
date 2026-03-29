-- Repair: older 0002 used `DROP TABLE Content`, which SQLite treats as `content`, removing the table
-- while leaving `merchants`. Idempotent when content already exists.
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

CREATE INDEX IF NOT EXISTS idx_content_merchant_id ON content(merchant_id);
CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);
CREATE INDEX IF NOT EXISTS idx_content_visibility ON content(visibility);
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);

-- Add chain column for multi-blockchain support
-- Default 'solana' for backward compatibility

ALTER TABLE content ADD COLUMN chain TEXT DEFAULT 'solana';
ALTER TABLE payment_intents ADD COLUMN chain TEXT DEFAULT 'solana';
ALTER TABLE purchases ADD COLUMN chain TEXT DEFAULT 'solana';

-- Index for filtering by chain (optional, useful for discovery)
CREATE INDEX IF NOT EXISTS idx_content_chain ON content(chain);
CREATE INDEX IF NOT EXISTS idx_payment_intents_chain ON payment_intents(chain);
CREATE INDEX IF NOT EXISTS idx_purchases_chain ON purchases(chain);
