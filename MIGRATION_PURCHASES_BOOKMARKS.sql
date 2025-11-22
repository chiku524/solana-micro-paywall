-- Migration: Add Purchase, Bookmark, and MerchantFollow models
-- Run this in Supabase SQL Editor or via psql
-- This migration adds buyer purchase tracking, bookmarking, and merchant following

-- Create Purchase table
CREATE TABLE IF NOT EXISTS "Purchase" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "accessTokenId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- Create Bookmark table
CREATE TABLE IF NOT EXISTS "Bookmark" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- Create MerchantFollow table
CREATE TABLE IF NOT EXISTS "MerchantFollow" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantFollow_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_accessTokenId_fkey" FOREIGN KEY ("accessTokenId") REFERENCES "AccessToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MerchantFollow" ADD CONSTRAINT "MerchantFollow_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_paymentId_key" ON "Purchase"("paymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_accessTokenId_key" ON "Purchase"("accessTokenId");
CREATE UNIQUE INDEX IF NOT EXISTS "Bookmark_walletAddress_contentId_key" ON "Bookmark"("walletAddress", "contentId");
CREATE UNIQUE INDEX IF NOT EXISTS "MerchantFollow_walletAddress_merchantId_key" ON "MerchantFollow"("walletAddress", "merchantId");

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "Purchase_walletAddress_idx" ON "Purchase"("walletAddress");
CREATE INDEX IF NOT EXISTS "Purchase_contentId_idx" ON "Purchase"("contentId");
CREATE INDEX IF NOT EXISTS "Purchase_merchantId_idx" ON "Purchase"("merchantId");
CREATE INDEX IF NOT EXISTS "Purchase_purchasedAt_idx" ON "Purchase"("purchasedAt");

CREATE INDEX IF NOT EXISTS "Bookmark_walletAddress_idx" ON "Bookmark"("walletAddress");
CREATE INDEX IF NOT EXISTS "Bookmark_contentId_idx" ON "Bookmark"("contentId");

CREATE INDEX IF NOT EXISTS "MerchantFollow_walletAddress_idx" ON "MerchantFollow"("walletAddress");
CREATE INDEX IF NOT EXISTS "MerchantFollow_merchantId_idx" ON "MerchantFollow"("merchantId");

-- Update AccessToken to add purchase relation (already handled by Prisma schema)
-- No SQL needed as it's just a relation field

