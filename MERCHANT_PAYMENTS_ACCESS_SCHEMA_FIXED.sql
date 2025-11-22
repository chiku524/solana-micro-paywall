-- ============================================================================
-- Merchant Payments and Access Schema - Fixed Version
-- This SQL script creates/updates PaymentIntent, Payment, and AccessToken tables
-- Run this in Supabase SQL Editor or via psql
-- ============================================================================

-- Enable UUID extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Step 1: Ensure Merchant table exists (required for foreign keys)
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

-- Add columns if they don't exist (safe for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'email') THEN
        ALTER TABLE "Merchant" ADD COLUMN "email" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'status') THEN
        ALTER TABLE "Merchant" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'payoutAddress') THEN
        ALTER TABLE "Merchant" ADD COLUMN "payoutAddress" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'webhookSecret') THEN
        ALTER TABLE "Merchant" ADD COLUMN "webhookSecret" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'configJson') THEN
        ALTER TABLE "Merchant" ADD COLUMN "configJson" JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'createdAt') THEN
        ALTER TABLE "Merchant" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'updatedAt') THEN
        ALTER TABLE "Merchant" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ============================================================================
-- Step 2: Ensure Content table exists (required for foreign keys)
-- ============================================================================

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

-- Add columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Content' AND column_name = 'merchantId') THEN
        ALTER TABLE "Content" ADD COLUMN "merchantId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Content' AND column_name = 'slug') THEN
        ALTER TABLE "Content" ADD COLUMN "slug" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Content' AND column_name = 'priceLamports') THEN
        ALTER TABLE "Content" ADD COLUMN "priceLamports" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Content' AND column_name = 'currency') THEN
        ALTER TABLE "Content" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SOL';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Content' AND column_name = 'durationSecs') THEN
        ALTER TABLE "Content" ADD COLUMN "durationSecs" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Content' AND column_name = 'metadata') THEN
        ALTER TABLE "Content" ADD COLUMN "metadata" JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Content' AND column_name = 'createdAt') THEN
        ALTER TABLE "Content" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Content' AND column_name = 'updatedAt') THEN
        ALTER TABLE "Content" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ============================================================================
-- Step 3: Create PaymentIntent table
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

-- Add columns if they don't exist (safe for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'merchantId') THEN
        ALTER TABLE "PaymentIntent" ADD COLUMN "merchantId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'contentId') THEN
        ALTER TABLE "PaymentIntent" ADD COLUMN "contentId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'memo') THEN
        ALTER TABLE "PaymentIntent" ADD COLUMN "memo" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'nonce') THEN
        ALTER TABLE "PaymentIntent" ADD COLUMN "nonce" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'amount') THEN
        ALTER TABLE "PaymentIntent" ADD COLUMN "amount" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'currency') THEN
        ALTER TABLE "PaymentIntent" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SOL';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'payerWallet') THEN
        ALTER TABLE "PaymentIntent" ADD COLUMN "payerWallet" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'status') THEN
        ALTER TABLE "PaymentIntent" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'createdAt') THEN
        ALTER TABLE "PaymentIntent" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'expiresAt') THEN
        ALTER TABLE "PaymentIntent" ADD COLUMN "expiresAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'confirmedAt') THEN
        ALTER TABLE "PaymentIntent" ADD COLUMN "confirmedAt" TIMESTAMP(3);
    END IF;
END $$;

-- ============================================================================
-- Step 4: Create Payment table
-- ============================================================================

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

-- Add columns if they don't exist (safe for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'intentId') THEN
        ALTER TABLE "Payment" ADD COLUMN "intentId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'txSignature') THEN
        ALTER TABLE "Payment" ADD COLUMN "txSignature" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'payerWallet') THEN
        ALTER TABLE "Payment" ADD COLUMN "payerWallet" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'amount') THEN
        ALTER TABLE "Payment" ADD COLUMN "amount" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'currency') THEN
        ALTER TABLE "Payment" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SOL';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'confirmedAt') THEN
        ALTER TABLE "Payment" ADD COLUMN "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'blockTime') THEN
        ALTER TABLE "Payment" ADD COLUMN "blockTime" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'slot') THEN
        ALTER TABLE "Payment" ADD COLUMN "slot" BIGINT;
    END IF;
END $$;

-- ============================================================================
-- Step 5: Create AccessToken table
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

-- Add columns if they don't exist (safe for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AccessToken' AND column_name = 'merchantId') THEN
        ALTER TABLE "AccessToken" ADD COLUMN "merchantId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AccessToken' AND column_name = 'contentId') THEN
        ALTER TABLE "AccessToken" ADD COLUMN "contentId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AccessToken' AND column_name = 'paymentId') THEN
        ALTER TABLE "AccessToken" ADD COLUMN "paymentId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AccessToken' AND column_name = 'tokenJti') THEN
        ALTER TABLE "AccessToken" ADD COLUMN "tokenJti" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AccessToken' AND column_name = 'expiresAt') THEN
        ALTER TABLE "AccessToken" ADD COLUMN "expiresAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AccessToken' AND column_name = 'redeemedAt') THEN
        ALTER TABLE "AccessToken" ADD COLUMN "redeemedAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AccessToken' AND column_name = 'createdAt') THEN
        ALTER TABLE "AccessToken" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ============================================================================
-- Step 6: Create Unique Constraints and Indexes
-- ============================================================================

-- PaymentIntent indexes
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIntent_memo_key" ON "PaymentIntent"("memo");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIntent_nonce_key" ON "PaymentIntent"("nonce");
CREATE INDEX IF NOT EXISTS "PaymentIntent_merchantId_idx" ON "PaymentIntent"("merchantId");
CREATE INDEX IF NOT EXISTS "PaymentIntent_contentId_idx" ON "PaymentIntent"("contentId");
CREATE INDEX IF NOT EXISTS "PaymentIntent_memo_idx" ON "PaymentIntent"("memo");
CREATE INDEX IF NOT EXISTS "PaymentIntent_status_idx" ON "PaymentIntent"("status");
CREATE INDEX IF NOT EXISTS "PaymentIntent_createdAt_idx" ON "PaymentIntent"("createdAt");

-- Payment indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_intentId_key" ON "Payment"("intentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_txSignature_key" ON "Payment"("txSignature");
CREATE INDEX IF NOT EXISTS "Payment_txSignature_idx" ON "Payment"("txSignature");
CREATE INDEX IF NOT EXISTS "Payment_payerWallet_idx" ON "Payment"("payerWallet");
CREATE INDEX IF NOT EXISTS "Payment_confirmedAt_idx" ON "Payment"("confirmedAt");
CREATE INDEX IF NOT EXISTS "Payment_intentId_idx" ON "Payment"("intentId");

-- AccessToken indexes
CREATE UNIQUE INDEX IF NOT EXISTS "AccessToken_paymentId_key" ON "AccessToken"("paymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "AccessToken_tokenJti_key" ON "AccessToken"("tokenJti");
CREATE INDEX IF NOT EXISTS "AccessToken_tokenJti_idx" ON "AccessToken"("tokenJti");
CREATE INDEX IF NOT EXISTS "AccessToken_merchantId_idx" ON "AccessToken"("merchantId");
CREATE INDEX IF NOT EXISTS "AccessToken_expiresAt_idx" ON "AccessToken"("expiresAt");

-- ============================================================================
-- Step 7: Create Foreign Key Constraints
-- ============================================================================

-- Drop existing constraints if they exist, then recreate them
DO $$ 
BEGIN
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
END $$;

-- Create foreign key constraints
ALTER TABLE "PaymentIntent" 
    ADD CONSTRAINT "PaymentIntent_merchantId_fkey" 
    FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentIntent" 
    ADD CONSTRAINT "PaymentIntent_contentId_fkey" 
    FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment" 
    ADD CONSTRAINT "Payment_intentId_fkey" 
    FOREIGN KEY ("intentId") REFERENCES "PaymentIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccessToken" 
    ADD CONSTRAINT "AccessToken_merchantId_fkey" 
    FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccessToken" 
    ADD CONSTRAINT "AccessToken_paymentId_fkey" 
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Step 8: Set NOT NULL constraints (only if tables are empty or columns have no NULLs)
-- ============================================================================

-- Make sure required columns are NOT NULL (safely handle existing data)
DO $$ 
DECLARE
    row_count INT;
BEGIN
    -- PaymentIntent: Only set NOT NULL if table is empty or column has no NULLs
    SELECT COUNT(*) INTO row_count FROM "PaymentIntent";
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "PaymentIntent" WHERE "merchantId" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'merchantId' AND is_nullable = 'YES') THEN
            ALTER TABLE "PaymentIntent" ALTER COLUMN "merchantId" SET NOT NULL;
        END IF;
    END IF;
    
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "PaymentIntent" WHERE "contentId" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'contentId' AND is_nullable = 'YES') THEN
            ALTER TABLE "PaymentIntent" ALTER COLUMN "contentId" SET NOT NULL;
        END IF;
    END IF;
    
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "PaymentIntent" WHERE "memo" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'memo' AND is_nullable = 'YES') THEN
            ALTER TABLE "PaymentIntent" ALTER COLUMN "memo" SET NOT NULL;
        END IF;
    END IF;
    
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "PaymentIntent" WHERE "nonce" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'nonce' AND is_nullable = 'YES') THEN
            ALTER TABLE "PaymentIntent" ALTER COLUMN "nonce" SET NOT NULL;
        END IF;
    END IF;
    
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "PaymentIntent" WHERE "amount" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'amount' AND is_nullable = 'YES') THEN
            ALTER TABLE "PaymentIntent" ALTER COLUMN "amount" SET NOT NULL;
        END IF;
    END IF;
    
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "PaymentIntent" WHERE "expiresAt" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentIntent' AND column_name = 'expiresAt' AND is_nullable = 'YES') THEN
            ALTER TABLE "PaymentIntent" ALTER COLUMN "expiresAt" SET NOT NULL;
        END IF;
    END IF;
    
    -- Payment: Only set NOT NULL if table is empty or column has no NULLs
    SELECT COUNT(*) INTO row_count FROM "Payment";
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "Payment" WHERE "intentId" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'intentId' AND is_nullable = 'YES') THEN
            ALTER TABLE "Payment" ALTER COLUMN "intentId" SET NOT NULL;
        END IF;
    END IF;
    
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "Payment" WHERE "txSignature" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'txSignature' AND is_nullable = 'YES') THEN
            ALTER TABLE "Payment" ALTER COLUMN "txSignature" SET NOT NULL;
        END IF;
    END IF;
    
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "Payment" WHERE "payerWallet" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'payerWallet' AND is_nullable = 'YES') THEN
            ALTER TABLE "Payment" ALTER COLUMN "payerWallet" SET NOT NULL;
        END IF;
    END IF;
    
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "Payment" WHERE "amount" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'amount' AND is_nullable = 'YES') THEN
            ALTER TABLE "Payment" ALTER COLUMN "amount" SET NOT NULL;
        END IF;
    END IF;
    
    -- AccessToken: Only set NOT NULL if table is empty or column has no NULLs
    SELECT COUNT(*) INTO row_count FROM "AccessToken";
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "AccessToken" WHERE "merchantId" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AccessToken' AND column_name = 'merchantId' AND is_nullable = 'YES') THEN
            ALTER TABLE "AccessToken" ALTER COLUMN "merchantId" SET NOT NULL;
        END IF;
    END IF;
    
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "AccessToken" WHERE "tokenJti" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AccessToken' AND column_name = 'tokenJti' AND is_nullable = 'YES') THEN
            ALTER TABLE "AccessToken" ALTER COLUMN "tokenJti" SET NOT NULL;
        END IF;
    END IF;
    
    IF row_count = 0 OR NOT EXISTS (SELECT 1 FROM "AccessToken" WHERE "expiresAt" IS NULL) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AccessToken' AND column_name = 'expiresAt' AND is_nullable = 'YES') THEN
            ALTER TABLE "AccessToken" ALTER COLUMN "expiresAt" SET NOT NULL;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Merchant Payments and Access Schema created/updated successfully!';
    RAISE NOTICE 'Tables: PaymentIntent, Payment, AccessToken';
    RAISE NOTICE 'All indexes and foreign keys have been created.';
END $$;

