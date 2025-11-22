-- ============================================================================
-- Migration: Referral System and API Keys
-- This migration adds ReferralCode, Referral, ApiKey, and ApiKeyUsage tables
-- Run this in Supabase SQL Editor or via psql
-- ============================================================================

-- ============================================================================
-- Referral System Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ReferralCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "merchantId" TEXT,
    "referrerWallet" TEXT,
    "discountPercent" INTEGER,
    "discountAmount" BIGINT,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "referrerWallet" TEXT NOT NULL,
    "refereeWallet" TEXT NOT NULL,
    "purchaseId" TEXT,
    "rewardAmount" BIGINT,
    "discountAmount" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- API Keys System Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "rateLimit" INTEGER,
    "allowedIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ApiKeyUsage" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKeyUsage_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- Foreign Keys
-- ============================================================================

-- ReferralCode foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ReferralCode_merchantId_fkey'
    ) THEN
        ALTER TABLE "ReferralCode" 
        ADD CONSTRAINT "ReferralCode_merchantId_fkey" 
        FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Referral foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Referral_referralCodeId_fkey'
    ) THEN
        ALTER TABLE "Referral" 
        ADD CONSTRAINT "Referral_referralCodeId_fkey" 
        FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode"("id") ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Referral_purchaseId_fkey'
    ) THEN
        ALTER TABLE "Referral" 
        ADD CONSTRAINT "Referral_purchaseId_fkey" 
        FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- ApiKey foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ApiKey_merchantId_fkey'
    ) THEN
        ALTER TABLE "ApiKey" 
        ADD CONSTRAINT "ApiKey_merchantId_fkey" 
        FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- ApiKeyUsage foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ApiKeyUsage_apiKeyId_fkey'
    ) THEN
        ALTER TABLE "ApiKeyUsage" 
        ADD CONSTRAINT "ApiKeyUsage_apiKeyId_fkey" 
        FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- Indexes
-- ============================================================================

-- ReferralCode indexes
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralCode_code_key" ON "ReferralCode"("code");
CREATE INDEX IF NOT EXISTS "ReferralCode_merchantId_idx" ON "ReferralCode"("merchantId");
CREATE INDEX IF NOT EXISTS "ReferralCode_referrerWallet_idx" ON "ReferralCode"("referrerWallet");
CREATE INDEX IF NOT EXISTS "ReferralCode_isActive_idx" ON "ReferralCode"("isActive");

-- Referral indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Referral_purchaseId_key" ON "Referral"("purchaseId");
CREATE INDEX IF NOT EXISTS "Referral_referralCodeId_idx" ON "Referral"("referralCodeId");
CREATE INDEX IF NOT EXISTS "Referral_referrerWallet_idx" ON "Referral"("referrerWallet");
CREATE INDEX IF NOT EXISTS "Referral_refereeWallet_idx" ON "Referral"("refereeWallet");
CREATE INDEX IF NOT EXISTS "Referral_createdAt_idx" ON "Referral"("createdAt");

-- ApiKey indexes
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX IF NOT EXISTS "ApiKey_merchantId_idx" ON "ApiKey"("merchantId");
CREATE INDEX IF NOT EXISTS "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- ApiKeyUsage indexes
CREATE INDEX IF NOT EXISTS "ApiKeyUsage_apiKeyId_idx" ON "ApiKeyUsage"("apiKeyId");
CREATE INDEX IF NOT EXISTS "ApiKeyUsage_createdAt_idx" ON "ApiKeyUsage"("createdAt");
CREATE INDEX IF NOT EXISTS "ApiKeyUsage_endpoint_idx" ON "ApiKeyUsage"("endpoint");

-- ============================================================================
-- Summary
-- ============================================================================
-- This migration creates:
-- 1. ReferralCode table for referral codes
-- 2. Referral table for tracking referral usage
-- 3. ApiKey table for merchant API keys
-- 4. ApiKeyUsage table for API key usage logs
-- 
-- All foreign keys and indexes are created for optimal performance

