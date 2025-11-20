-- Migration: Add discovery and presentation fields to Content table
-- Run this in Supabase SQL Editor or via psql
-- This migration adds fields for content discovery, marketplace listings, and better presentation

-- Add discovery fields
ALTER TABLE "Content"
    ADD COLUMN IF NOT EXISTS "title" TEXT,
    ADD COLUMN IF NOT EXISTS "description" TEXT,
    ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "category" TEXT,
    ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'private',
    ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "previewText" TEXT,
    ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "purchaseCount" INTEGER NOT NULL DEFAULT 0;

-- Add indexes for discovery queries
CREATE INDEX IF NOT EXISTS "Content_visibility_idx" ON "Content"("visibility");
CREATE INDEX IF NOT EXISTS "Content_category_idx" ON "Content"("category");
CREATE INDEX IF NOT EXISTS "Content_createdAt_idx" ON "Content"("createdAt");

-- Update purchaseCount based on existing payments
UPDATE "Content" c
SET "purchaseCount" = (
    SELECT COUNT(*)
    FROM "PaymentIntent" pi
    WHERE pi."contentId" = c.id
    AND pi."status" = 'confirmed'
);

-- ============================================================================
-- Performance Optimization: Critical Indexes
-- ============================================================================

-- Payment Intent indexes (critical for payment verification)
CREATE INDEX IF NOT EXISTS "idx_payment_intent_memo" ON "PaymentIntent"("memo");
CREATE INDEX IF NOT EXISTS "idx_payment_intent_status_expires" ON "PaymentIntent"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "idx_payment_intent_merchant_status" ON "PaymentIntent"("merchantId", "status");
CREATE INDEX IF NOT EXISTS "idx_payment_intent_merchant_created" ON "PaymentIntent"("merchantId", "createdAt" DESC);

-- Payment indexes
CREATE INDEX IF NOT EXISTS "idx_payment_tx_signature" ON "Payment"("txSignature");
CREATE INDEX IF NOT EXISTS "idx_payment_payer_wallet" ON "Payment"("payerWallet");
CREATE INDEX IF NOT EXISTS "idx_payment_confirmed_at" ON "Payment"("confirmedAt");

-- Access Token indexes
CREATE INDEX IF NOT EXISTS "idx_access_token_expires" ON "AccessToken"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_access_token_merchant_expires" ON "AccessToken"("merchantId", "expiresAt");
CREATE INDEX IF NOT EXISTS "idx_access_token_redeemed" ON "AccessToken"("redeemedAt") WHERE "redeemedAt" IS NULL;

-- Content discovery indexes (for marketplace)
CREATE INDEX IF NOT EXISTS "idx_content_visibility_category" ON "Content"("visibility", "category");
CREATE INDEX IF NOT EXISTS "idx_content_tags" ON "Content" USING GIN("tags");
CREATE INDEX IF NOT EXISTS "idx_content_search" ON "Content" USING GIN(
  to_tsvector('english', COALESCE("title", '') || ' ' || COALESCE("description", ''))
);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS "idx_ledger_event_type_created" ON "LedgerEvent"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_dashboard_event_merchant_created" ON "DashboardEvent"("merchantId", "createdAt");


