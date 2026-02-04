-- Add chain column for multi-blockchain support
-- Default 'solana' for backward compatibility

ALTER TABLE content ADD COLUMN chain TEXT DEFAULT 'solana';
ALTER TABLE payment_intents ADD COLUMN chain TEXT DEFAULT 'solana';
ALTER TABLE purchases ADD COLUMN chain TEXT DEFAULT 'solana';

-- Index for filtering by chain (optional, useful for discovery)
CREATE INDEX IF NOT EXISTS idx_content_chain ON content(chain);
CREATE INDEX IF NOT EXISTS idx_payment_intents_chain ON payment_intents(chain);
CREATE INDEX IF NOT EXISTS idx_purchases_chain ON purchases(chain);
