-- Manual Migration SQL for Supabase
-- Run this in Supabase SQL Editor if automatic migrations don't work
-- Go to: https://supabase.com/dashboard/project/boqdxdxkaszzfgfohdso/editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Merchant & Content Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Merchant" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payoutAddress" TEXT,
    "webhookSecret" TEXT,
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- Ensure Merchant columns exist (for previously created tables)
ALTER TABLE "Merchant"
    ADD COLUMN IF NOT EXISTS "email" TEXT,
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS "payoutAddress" TEXT,
    ADD COLUMN IF NOT EXISTS "webhookSecret" TEXT,
    ADD COLUMN IF NOT EXISTS "configJson" JSONB,
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "Content" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "priceLamports" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SOL',
    "durationSecs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- Ensure Content columns exist
ALTER TABLE "Content"
    ADD COLUMN IF NOT EXISTS "merchantId" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "slug" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "priceLamports" BIGINT NOT NULL,
    ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'SOL',
    ADD COLUMN IF NOT EXISTS "durationSecs" INTEGER,
    ADD COLUMN IF NOT EXISTS "metadata" JSONB,
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- Payment Flow
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PaymentIntent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "memo" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SOL',
    "payerWallet" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- Ensure PaymentIntent columns exist
ALTER TABLE "PaymentIntent"
    ADD COLUMN IF NOT EXISTS "merchantId" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "contentId" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "memo" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "nonce" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "amount" BIGINT NOT NULL,
    ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'SOL',
    ADD COLUMN IF NOT EXISTS "payerWallet" TEXT,
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3) NOT NULL,
    ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "txSignature" TEXT NOT NULL,
    "payerWallet" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SOL',
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockTime" BIGINT,
    "slot" BIGINT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- Ensure Payment columns exist
ALTER TABLE "Payment"
    ADD COLUMN IF NOT EXISTS "intentId" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "txSignature" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "payerWallet" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "amount" BIGINT NOT NULL,
    ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'SOL',
    ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "blockTime" BIGINT,
    ADD COLUMN IF NOT EXISTS "slot" BIGINT;

-- ============================================================================
-- Access Control
-- ============================================================================

CREATE TABLE IF NOT EXISTS "AccessToken" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "contentId" TEXT,
    "paymentId" TEXT,
    "tokenJti" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessToken_pkey" PRIMARY KEY ("id")
);

-- Ensure AccessToken columns exist
ALTER TABLE "AccessToken"
    ADD COLUMN IF NOT EXISTS "merchantId" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "contentId" TEXT,
    ADD COLUMN IF NOT EXISTS "paymentId" TEXT,
    ADD COLUMN IF NOT EXISTS "tokenJti" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3) NOT NULL,
    ADD COLUMN IF NOT EXISTS "redeemedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- Refunds & Reconciliation
-- ============================================================================

CREATE TABLE IF NOT EXISTS "RefundRequest" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "refundTxSignature" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

-- Ensure RefundRequest columns exist
ALTER TABLE "RefundRequest"
    ADD COLUMN IF NOT EXISTS "merchantId" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "paymentId" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS "reason" TEXT,
    ADD COLUMN IF NOT EXISTS "refundTxSignature" TEXT,
    ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- Optional: Stripe Fallback
-- ============================================================================

CREATE TABLE IF NOT EXISTS "StripeReceipt" (
    "id" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "contentId" TEXT,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "payerEmail" TEXT,
    "accessTokenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeReceipt_pkey" PRIMARY KEY ("id")
);

-- Ensure StripeReceipt columns exist
ALTER TABLE "StripeReceipt"
    ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "merchantId" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "contentId" TEXT,
    ADD COLUMN IF NOT EXISTS "amount" BIGINT NOT NULL,
    ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS "payerEmail" TEXT,
    ADD COLUMN IF NOT EXISTS "accessTokenId" TEXT,
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- Analytics & Audit
-- ============================================================================

CREATE TABLE IF NOT EXISTS "DashboardEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LedgerEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousState" JSONB,
    "newState" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEvent_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "Merchant_email_key" ON "Merchant"("email");
CREATE INDEX IF NOT EXISTS "Merchant_email_idx" ON "Merchant"("email");
CREATE INDEX IF NOT EXISTS "Merchant_status_idx" ON "Merchant"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "Content_merchantId_slug_key" ON "Content"("merchantId", "slug");
CREATE INDEX IF NOT EXISTS "Content_merchantId_idx" ON "Content"("merchantId");

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIntent_memo_key" ON "PaymentIntent"("memo");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIntent_nonce_key" ON "PaymentIntent"("nonce");
CREATE INDEX IF NOT EXISTS "PaymentIntent_merchantId_idx" ON "PaymentIntent"("merchantId");
CREATE INDEX IF NOT EXISTS "PaymentIntent_contentId_idx" ON "PaymentIntent"("contentId");
CREATE INDEX IF NOT EXISTS "PaymentIntent_memo_idx" ON "PaymentIntent"("memo");
CREATE INDEX IF NOT EXISTS "PaymentIntent_status_idx" ON "PaymentIntent"("status");
CREATE INDEX IF NOT EXISTS "PaymentIntent_createdAt_idx" ON "PaymentIntent"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_intentId_key" ON "Payment"("intentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_txSignature_key" ON "Payment"("txSignature");
CREATE INDEX IF NOT EXISTS "Payment_txSignature_idx" ON "Payment"("txSignature");
CREATE INDEX IF NOT EXISTS "Payment_payerWallet_idx" ON "Payment"("payerWallet");
CREATE INDEX IF NOT EXISTS "Payment_confirmedAt_idx" ON "Payment"("confirmedAt");
CREATE INDEX IF NOT EXISTS "Payment_intentId_idx" ON "Payment"("intentId");

CREATE UNIQUE INDEX IF NOT EXISTS "AccessToken_paymentId_key" ON "AccessToken"("paymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "AccessToken_tokenJti_key" ON "AccessToken"("tokenJti");
CREATE INDEX IF NOT EXISTS "AccessToken_tokenJti_idx" ON "AccessToken"("tokenJti");
CREATE INDEX IF NOT EXISTS "AccessToken_merchantId_idx" ON "AccessToken"("merchantId");
CREATE INDEX IF NOT EXISTS "AccessToken_expiresAt_idx" ON "AccessToken"("expiresAt");

CREATE INDEX IF NOT EXISTS "RefundRequest_merchantId_idx" ON "RefundRequest"("merchantId");
CREATE INDEX IF NOT EXISTS "RefundRequest_paymentId_idx" ON "RefundRequest"("paymentId");
CREATE INDEX IF NOT EXISTS "RefundRequest_status_idx" ON "RefundRequest"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "StripeReceipt_stripeSessionId_key" ON "StripeReceipt"("stripeSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "StripeReceipt_accessTokenId_key" ON "StripeReceipt"("accessTokenId");
CREATE INDEX IF NOT EXISTS "StripeReceipt_stripeSessionId_idx" ON "StripeReceipt"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "StripeReceipt_merchantId_idx" ON "StripeReceipt"("merchantId");

CREATE INDEX IF NOT EXISTS "DashboardEvent_merchantId_idx" ON "DashboardEvent"("merchantId");
CREATE INDEX IF NOT EXISTS "DashboardEvent_eventType_idx" ON "DashboardEvent"("eventType");
CREATE INDEX IF NOT EXISTS "DashboardEvent_createdAt_idx" ON "DashboardEvent"("createdAt");

CREATE INDEX IF NOT EXISTS "LedgerEvent_eventType_idx" ON "LedgerEvent"("eventType");
CREATE INDEX IF NOT EXISTS "LedgerEvent_entityType_entityId_idx" ON "LedgerEvent"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "LedgerEvent_createdAt_idx" ON "LedgerEvent"("createdAt");

-- ============================================================================
-- Foreign Keys
-- ============================================================================

-- Drop existing constraints if they exist, then recreate them
DO $$ 
BEGIN
    -- Content foreign keys
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Content_merchantId_fkey') THEN
        ALTER TABLE "Content" DROP CONSTRAINT "Content_merchantId_fkey";
    END IF;
    
    -- PaymentIntent foreign keys
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentIntent_merchantId_fkey') THEN
        ALTER TABLE "PaymentIntent" DROP CONSTRAINT "PaymentIntent_merchantId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentIntent_contentId_fkey') THEN
        ALTER TABLE "PaymentIntent" DROP CONSTRAINT "PaymentIntent_contentId_fkey";
    END IF;
    
    -- Payment foreign keys
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_intentId_fkey') THEN
        ALTER TABLE "Payment" DROP CONSTRAINT "Payment_intentId_fkey";
    END IF;
    
    -- AccessToken foreign keys
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AccessToken_merchantId_fkey') THEN
        ALTER TABLE "AccessToken" DROP CONSTRAINT "AccessToken_merchantId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AccessToken_paymentId_fkey') THEN
        ALTER TABLE "AccessToken" DROP CONSTRAINT "AccessToken_paymentId_fkey";
    END IF;
    
    -- RefundRequest foreign keys
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RefundRequest_merchantId_fkey') THEN
        ALTER TABLE "RefundRequest" DROP CONSTRAINT "RefundRequest_merchantId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RefundRequest_paymentId_fkey') THEN
        ALTER TABLE "RefundRequest" DROP CONSTRAINT "RefundRequest_paymentId_fkey";
    END IF;
    
    -- StripeReceipt foreign keys
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StripeReceipt_accessTokenId_fkey') THEN
        ALTER TABLE "StripeReceipt" DROP CONSTRAINT "StripeReceipt_accessTokenId_fkey";
    END IF;
END $$;

-- Now create all foreign key constraints
ALTER TABLE "Content" ADD CONSTRAINT "Content_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "PaymentIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessToken" ADD CONSTRAINT "AccessToken_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessToken" ADD CONSTRAINT "AccessToken_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StripeReceipt" ADD CONSTRAINT "StripeReceipt_accessTokenId_fkey" FOREIGN KEY ("accessTokenId") REFERENCES "AccessToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Triggers for updatedAt fields (to match Prisma @updatedAt behavior)
-- ============================================================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist, then create them
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_merchant_updated_at') THEN
        DROP TRIGGER IF EXISTS update_merchant_updated_at ON "Merchant";
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_updated_at') THEN
        DROP TRIGGER IF EXISTS update_content_updated_at ON "Content";
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_refund_request_updated_at') THEN
        DROP TRIGGER IF EXISTS update_refund_request_updated_at ON "RefundRequest";
    END IF;
END $$;

-- Create triggers for tables with updatedAt
CREATE TRIGGER update_merchant_updated_at BEFORE UPDATE ON "Merchant"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON "Content"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refund_request_updated_at BEFORE UPDATE ON "RefundRequest"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

