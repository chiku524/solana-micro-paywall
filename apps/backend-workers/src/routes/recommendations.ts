/**
 * Recommendations routes
 */

import { Hono } from 'hono';
import { Env } from '../types/env';
import { query, queryOne } from '../utils/db';
import { cacheResponse } from '../middleware/cache';

export function recommendationsRoutes(app: Hono<{ Bindings: Env }>) {
  // Get recommendations for a wallet address (public, cached)
  app.get('/recommendations/for-wallet', cacheResponse({ ttl: 300 }), async (c) => {
    try {
      const walletAddress = c.req.query('walletAddress');
      const limit = parseInt(c.req.query('limit') || '6');

      if (!walletAddress) {
        return c.json({ error: 'Bad Request', message: 'walletAddress query parameter is required' }, 400);
      }

      // Get user's purchase history
      const purchases = await query(
        c.env.DB,
        `SELECT Purchase.contentId, Content.category, Content.tags, Content.merchantId
         FROM Purchase
         INNER JOIN Content ON Purchase.contentId = Content.id
         WHERE Purchase.walletAddress = ?
         ORDER BY Purchase.purchasedAt DESC
         LIMIT 50`,
        [walletAddress]
      );

      if (purchases.length === 0) {
        // No purchase history, return trending content
        return getTrendingContent(c, limit);
      }

      // Analyze preferences
      const categoryCounts = new Map<string, number>();
      const merchantCounts = new Map<string, number>();
      const tagCounts = new Map<string, number>();

      purchases.forEach((purchase: any) => {
        if (purchase.category) {
          categoryCounts.set(purchase.category, (categoryCounts.get(purchase.category) || 0) + 1);
        }
        merchantCounts.set(purchase.merchantId, (merchantCounts.get(purchase.merchantId) || 0) + 1);
        
        if (purchase.tags) {
          try {
            const tags = typeof purchase.tags === 'string' ? JSON.parse(purchase.tags) : purchase.tags;
            if (Array.isArray(tags)) {
              tags.forEach((tag: string) => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
              });
            }
          } catch (e) {
            // Ignore tag parsing errors
          }
        }
      });

      // Get top categories and merchants
      const topCategories = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);

      const topMerchants = Array.from(merchantCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([merchantId]) => merchantId);

      const topTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);

      // Get purchased content IDs to exclude
      const purchasedContentIds = purchases.map((p: any) => p.contentId);

      // Build WHERE clause
      const conditions: string[] = [];
      const params: any[] = [];

      conditions.push('Content.id NOT IN (' + purchasedContentIds.map(() => '?').join(',') + ')');
      params.push(...purchasedContentIds);

      conditions.push("Content.visibility = 'public'");
      conditions.push("Merchant.status = 'active'");

      const orConditions: string[] = [];
      if (topCategories.length > 0) {
        orConditions.push('Content.category IN (' + topCategories.map(() => '?').join(',') + ')');
        params.push(...topCategories);
      }
      if (topMerchants.length > 0) {
        orConditions.push('Content.merchantId IN (' + topMerchants.map(() => '?').join(',') + ')');
        params.push(...topMerchants);
      }

      if (orConditions.length > 0) {
        conditions.push('(' + orConditions.join(' OR ') + ')');
      }

      const whereClause = conditions.join(' AND ');

      // Find recommended content
      const recommendations = await query(
        c.env.DB,
        `SELECT 
          Content.*,
          Merchant.id as merchant_id,
          Merchant.email as merchant_email,
          (SELECT COUNT(*) FROM Purchase WHERE contentId = Content.id) as purchase_count
         FROM Content
         INNER JOIN Merchant ON Content.merchantId = Merchant.id
         WHERE ${whereClause}
         ORDER BY Content.purchaseCount DESC, Content.createdAt DESC
         LIMIT ?`,
        [...params, limit]
      );

      const result = recommendations.map((content: any) => ({
        ...content,
        priceLamports: content.priceLamports?.toString() || '0',
        purchaseCount: content.purchase_count || content.purchaseCount || 0,
        tags: content.tags ? (typeof content.tags === 'string' ? JSON.parse(content.tags) : content.tags) : [],
        merchant: {
          id: content.merchant_id,
          email: content.merchant_email,
        },
      }));

      return c.json(result);
    } catch (error: any) {
      console.error('Get recommendations for wallet error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get recommendations for a specific content (public, cached)
  app.get('/recommendations/for-content/:contentId', cacheResponse({ ttl: 600 }), async (c) => {
    try {
      const contentId = c.req.param('contentId');
      const limit = parseInt(c.req.query('limit') || '6');

      // Get content details
      const content = await queryOne(
        c.env.DB,
        `SELECT category, tags, merchantId FROM Content WHERE id = ?`,
        [contentId]
      );

      if (!content) {
        return getTrendingContent(c, limit);
      }

      // Try collaborative filtering first
      const collaborative = await getCollaborativeRecommendations(c, contentId, limit * 2);

      if (collaborative.length >= limit) {
        return c.json(collaborative.slice(0, limit));
      }

      // Fall back to content-based filtering
      const tags = content.tags ? (typeof content.tags === 'string' ? JSON.parse(content.tags) : content.tags) : [];
      const conditions: string[] = [];
      const params: any[] = [];

      conditions.push('Content.id != ?');
      params.push(contentId);
      conditions.push("Content.visibility = 'public'");
      conditions.push("Merchant.status = 'active'");

      const orConditions: string[] = [];
      if (content.category) {
        orConditions.push('Content.category = ?');
        params.push(content.category);
      }
      orConditions.push('Content.merchantId = ?');
      params.push(content.merchantId);

      if (orConditions.length > 0) {
        conditions.push('(' + orConditions.join(' OR ') + ')');
      }

      const whereClause = conditions.join(' AND ');

      const recommendations = await query(
        c.env.DB,
        `SELECT 
          Content.*,
          Merchant.id as merchant_id,
          Merchant.email as merchant_email,
          (SELECT COUNT(*) FROM Purchase WHERE contentId = Content.id) as purchase_count
         FROM Content
         INNER JOIN Merchant ON Content.merchantId = Merchant.id
         WHERE ${whereClause}
         ORDER BY Content.purchaseCount DESC, Content.createdAt DESC
         LIMIT ?`,
        [...params, limit]
      );

      // Merge collaborative and content-based results
      const collaborativeIds = new Set(collaborative.map((c: any) => c.id));
      const contentBased = recommendations.filter((c: any) => !collaborativeIds.has(c.id));
      const merged = [...collaborative, ...contentBased].slice(0, limit);

      const result = merged.map((item: any) => ({
        ...item,
        priceLamports: item.priceLamports?.toString() || '0',
        purchaseCount: item.purchase_count || item.purchaseCount || 0,
        tags: item.tags ? (typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags) : [],
        merchant: {
          id: item.merchant_id,
          email: item.merchant_email,
        },
      }));

      return c.json(result);
    } catch (error: any) {
      console.error('Get recommendations for content error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get collaborative recommendations (public, cached)
  app.get('/recommendations/collaborative/:contentId', cacheResponse({ ttl: 900 }), async (c) => {
    try {
      const contentId = c.req.param('contentId');
      const limit = parseInt(c.req.query('limit') || '6');

      const recommendations = await getCollaborativeRecommendations(c, contentId, limit);
      return c.json(recommendations);
    } catch (error: any) {
      console.error('Get collaborative recommendations error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });
}

// Helper function to get trending content
async function getTrendingContent(c: any, limit: number) {
  const trending = await query(
    c.env.DB,
    `SELECT 
      Content.*,
      Merchant.id as merchant_id,
      Merchant.email as merchant_email,
      (SELECT COUNT(*) FROM Purchase WHERE contentId = Content.id) as purchase_count
     FROM Content
     INNER JOIN Merchant ON Content.merchantId = Merchant.id
     WHERE Content.visibility = 'public' AND Merchant.status = 'active'
     ORDER BY Content.purchaseCount DESC, Content.viewCount DESC, Content.createdAt DESC
     LIMIT ?`,
    [limit]
  );

  const result = trending.map((content: any) => ({
    ...content,
    priceLamports: content.priceLamports?.toString() || '0',
    purchaseCount: content.purchase_count || content.purchaseCount || 0,
    tags: content.tags ? (typeof content.tags === 'string' ? JSON.parse(content.tags) : content.tags) : [],
    merchant: {
      id: content.merchant_id,
      email: content.merchant_email,
    },
  }));

  return c.json(result);
}

// Helper function for collaborative filtering
async function getCollaborativeRecommendations(c: any, contentId: string, limit: number) {
  // Find all users who purchased this content
  const purchasers = await query(
    c.env.DB,
    `SELECT DISTINCT walletAddress FROM Purchase WHERE contentId = ?`,
    [contentId]
  );

  if (purchasers.length === 0) {
    return [];
  }

  const purchaserWallets = purchasers.map((p: any) => p.walletAddress);

  // Find other content purchased by the same users
  const placeholders = purchaserWallets.map(() => '?').join(',');
  const relatedPurchases = await query(
    c.env.DB,
    `SELECT 
      Purchase.contentId,
      COUNT(*) as score
     FROM Purchase
     INNER JOIN Content ON Purchase.contentId = Content.id
     INNER JOIN Merchant ON Content.merchantId = Merchant.id
     WHERE Purchase.walletAddress IN (${placeholders})
       AND Purchase.contentId != ?
       AND Content.visibility = 'public'
       AND Merchant.status = 'active'
     GROUP BY Purchase.contentId
     ORDER BY score DESC
     LIMIT ?`,
    [...purchaserWallets, contentId, limit]
  );

  if (relatedPurchases.length === 0) {
    return [];
  }

  const contentIds = relatedPurchases.map((p: any) => p.contentId);
  const contentPlaceholders = contentIds.map(() => '?').join(',');

  const recommendations = await query(
    c.env.DB,
    `SELECT 
      Content.*,
      Merchant.id as merchant_id,
      Merchant.email as merchant_email,
      (SELECT COUNT(*) FROM Purchase WHERE contentId = Content.id) as purchase_count
     FROM Content
     INNER JOIN Merchant ON Content.merchantId = Merchant.id
     WHERE Content.id IN (${contentPlaceholders})
     ORDER BY Content.purchaseCount DESC`,
    contentIds
  );

  // Map scores to content
  const scoreMap = new Map(relatedPurchases.map((p: any) => [p.contentId, p.score]));

  const result = recommendations.map((content: any) => ({
    ...content,
    priceLamports: content.priceLamports?.toString() || '0',
    purchaseCount: content.purchase_count || content.purchaseCount || 0,
    tags: content.tags ? (typeof content.tags === 'string' ? JSON.parse(content.tags) : content.tags) : [],
    collaborativeScore: scoreMap.get(content.id) || 0,
    merchant: {
      id: content.merchant_id,
      email: content.merchant_email,
    },
  }));

  return result;
}

