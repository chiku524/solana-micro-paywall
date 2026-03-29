-- Merchant policy, support, outbound webhooks
ALTER TABLE merchants ADD COLUMN refund_policy_text TEXT;
ALTER TABLE merchants ADD COLUMN support_contact_email TEXT;
ALTER TABLE merchants ADD COLUMN webhook_url TEXT;

-- Content: USD display/target, related items, free preview truncation
ALTER TABLE content ADD COLUMN display_price_usd REAL;
ALTER TABLE content ADD COLUMN target_price_usd REAL;
ALTER TABLE content ADD COLUMN related_content_ids TEXT;
ALTER TABLE content ADD COLUMN free_preview_char_limit INTEGER;

-- Idempotent payment request creation (optional client key)
ALTER TABLE payment_intents ADD COLUMN idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_intents_idempotency_key ON payment_intents(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Developer API keys (hashed at rest)
CREATE TABLE IF NOT EXISTS merchant_api_keys (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  label TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_used_at INTEGER,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_merchant_api_keys_merchant_id ON merchant_api_keys(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_api_keys_key_hash ON merchant_api_keys(key_hash);

-- Webhook delivery audit log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  purchase_id TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'pending')),
  http_status INTEGER,
  response_preview TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_merchant_id ON webhook_deliveries(merchant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);

-- Lightweight funnel / engagement events (optional content_id)
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  content_id TEXT,
  merchant_id TEXT,
  event_type TEXT NOT NULL,
  meta TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_content ON analytics_events(content_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_merchant ON analytics_events(merchant_id, event_type, created_at);
