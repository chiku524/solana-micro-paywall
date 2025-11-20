-- Migration: Add discovery and presentation fields to Content table
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

