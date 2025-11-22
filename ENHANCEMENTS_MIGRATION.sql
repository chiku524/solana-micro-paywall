-- ============================================================================
-- Enhancement Migration: Additional Indexes and Optimizations
-- This migration adds indexes for new features and optimizes existing queries
-- Run this in Supabase SQL Editor or via psql
-- ============================================================================

-- Add merchant profile fields if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'displayName') THEN
        ALTER TABLE "Merchant" ADD COLUMN "displayName" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'bio') THEN
        ALTER TABLE "Merchant" ADD COLUMN "bio" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'avatarUrl') THEN
        ALTER TABLE "Merchant" ADD COLUMN "avatarUrl" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'websiteUrl') THEN
        ALTER TABLE "Merchant" ADD COLUMN "websiteUrl" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'twitterUrl') THEN
        ALTER TABLE "Merchant" ADD COLUMN "twitterUrl" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'telegramUrl') THEN
        ALTER TABLE "Merchant" ADD COLUMN "telegramUrl" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'discordUrl') THEN
        ALTER TABLE "Merchant" ADD COLUMN "discordUrl" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Merchant' AND column_name = 'githubUrl') THEN
        ALTER TABLE "Merchant" ADD COLUMN "githubUrl" TEXT;
    END IF;
END $$;

-- ============================================================================
-- Performance Indexes for Purchases
-- ============================================================================

-- Composite index for checking access (most common query)
CREATE INDEX IF NOT EXISTS "idx_purchase_wallet_merchant_content" 
ON "Purchase"("walletAddress", "merchantId", "contentId");

-- Index for expiration checks
CREATE INDEX IF NOT EXISTS "idx_purchase_expires_at" 
ON "Purchase"("expiresAt") WHERE "expiresAt" IS NOT NULL;

-- Index for active purchases (not expired)
CREATE INDEX IF NOT EXISTS "idx_purchase_active" 
ON "Purchase"("walletAddress", "expiresAt") 
WHERE "expiresAt" IS NULL OR "expiresAt" > NOW();

-- Index for merchant sales analytics
CREATE INDEX IF NOT EXISTS "idx_purchase_merchant_purchased" 
ON "Purchase"("merchantId", "purchasedAt" DESC);

-- ============================================================================
-- Performance Indexes for Bookmarks
-- ============================================================================

-- Index for user bookmarks
CREATE INDEX IF NOT EXISTS "idx_bookmark_wallet_created" 
ON "Bookmark"("walletAddress", "createdAt" DESC);

-- Index for content bookmark count
CREATE INDEX IF NOT EXISTS "idx_bookmark_content" 
ON "Bookmark"("contentId");

-- ============================================================================
-- Performance Indexes for Merchant Follows
-- ============================================================================

-- Index for follower queries
CREATE INDEX IF NOT EXISTS "idx_merchant_follow_wallet" 
ON "MerchantFollow"("walletAddress", "createdAt" DESC);

-- Index for merchant follower count
CREATE INDEX IF NOT EXISTS "idx_merchant_follow_merchant" 
ON "MerchantFollow"("merchantId");

-- ============================================================================
-- Performance Indexes for Recommendations
-- ============================================================================

-- Composite index for content recommendations (category + tags)
CREATE INDEX IF NOT EXISTS "idx_content_category_tags" 
ON "Content"("category", "tags") 
WHERE "visibility" = 'public';

-- Index for trending content queries
CREATE INDEX IF NOT EXISTS "idx_content_trending" 
ON "Content"("purchaseCount" DESC, "viewCount" DESC, "createdAt" DESC) 
WHERE "visibility" = 'public';

-- ============================================================================
-- Additional Content Indexes
-- ============================================================================

-- Full-text search index (if not exists)
CREATE INDEX IF NOT EXISTS "idx_content_fulltext_search" 
ON "Content" USING GIN(
  to_tsvector('english', 
    COALESCE("title", '') || ' ' || 
    COALESCE("description", '') || ' ' || 
    COALESCE("previewText", '')
  )
) WHERE "visibility" = 'public';

-- Index for merchant content listing
CREATE INDEX IF NOT EXISTS "idx_content_merchant_visibility_created" 
ON "Content"("merchantId", "visibility", "createdAt" DESC);

-- ============================================================================
-- Analytics and Reporting Indexes
-- ============================================================================

-- Index for payment analytics by merchant
CREATE INDEX IF NOT EXISTS "idx_payment_merchant_confirmed" 
ON "Payment"("intentId") 
INCLUDE ("amount", "confirmedAt")
WHERE EXISTS (
  SELECT 1 FROM "PaymentIntent" pi 
  WHERE pi.id = "Payment"."intentId"
);

-- Index for dashboard events
CREATE INDEX IF NOT EXISTS "idx_dashboard_event_merchant_type_created" 
ON "DashboardEvent"("merchantId", "eventType", "createdAt" DESC) 
WHERE "merchantId" IS NOT NULL;

-- ============================================================================
-- Summary
-- ============================================================================
-- This migration adds:
-- 1. Merchant profile fields (displayName, bio, avatarUrl, social links)
-- 2. Performance indexes for purchases, bookmarks, and follows
-- 3. Enhanced content discovery indexes
-- 4. Analytics and reporting indexes
-- 
-- Run this after the main schema setup to optimize query performance

