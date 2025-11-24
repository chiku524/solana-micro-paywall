/**
 * Purchases routes
 */

import { Hono } from 'hono';
import { Env } from '../types/env';
import { query, queryOne, execute } from '../utils/db';

function generateId(): string {
  return crypto.randomUUID();
}

export function purchasesRoutes(app: Hono<{ Bindings: Env }>) {
  // Get purchases by wallet (public)
  app.get('/purchases', async (c) => {
    try {
      const walletAddress = c.req.query('walletAddress');
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const skip = (page - 1) * limit;

      if (!walletAddress) {
        return c.json({ error: 'Bad Request', message: 'walletAddress query parameter is required' }, 400);
      }

      const purchases = await query(
        c.env.DB,
        `SELECT Purchase.*, Content.id as content_id, Content.slug, Content.title, Content.description, Content.thumbnailUrl, Content.category, Content.priceLamports, Content.currency,
                Merchant.id as merchant_id, Merchant.email as merchant_email
         FROM Purchase
         INNER JOIN Content ON Purchase.contentId = Content.id
         INNER JOIN Merchant ON Purchase.merchantId = Merchant.id
         WHERE Purchase.walletAddress = ?
         ORDER BY Purchase.createdAt DESC
         LIMIT ? OFFSET ?`,
        [walletAddress, limit, skip]
      );

      const totalResult = await queryOne<{ count: number }>(
        c.env.DB,
        'SELECT COUNT(*) as count FROM Purchase WHERE walletAddress = ?',
        [walletAddress]
      );
      const total = totalResult?.count || 0;

      const formattedPurchases = purchases.map((p: any) => ({
        id: p.id,
        walletAddress: p.walletAddress,
        amount: p.amount.toString(),
        currency: p.currency,
        expiresAt: p.expiresAt,
        createdAt: p.createdAt,
        content: {
          id: p.content_id,
          slug: p.slug,
          title: p.title,
          description: p.description,
          thumbnailUrl: p.thumbnailUrl,
          category: p.category,
          priceLamports: p.priceLamports.toString(),
          currency: p.currency,
        },
        merchant: {
          id: p.merchant_id,
          email: p.merchant_email,
        },
      }));

      return c.json({
        purchases: formattedPurchases,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: any) {
      console.error('Get purchases error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Check access (public)
  app.get('/purchases/check-access', async (c) => {
    try {
      const walletAddress = c.req.query('walletAddress');
      const merchantId = c.req.query('merchantId');
      const contentSlug = c.req.query('contentSlug');

      if (!walletAddress || !merchantId || !contentSlug) {
        return c.json({ error: 'Bad Request', message: 'walletAddress, merchantId, and contentSlug are required' }, 400);
      }

      // Get content by slug
      const content = await queryOne<{ id: string }>(
        c.env.DB,
        'SELECT id FROM Content WHERE merchantId = ? AND slug = ?',
        [merchantId, contentSlug]
      );

      if (!content) {
        return c.json({ hasAccess: false });
      }

      // Check if purchase exists and is not expired
      const purchase = await queryOne(
        c.env.DB,
        `SELECT id FROM Purchase
         WHERE walletAddress = ? AND merchantId = ? AND contentId = ?
         AND (expiresAt IS NULL OR expiresAt > datetime('now'))`,
        [walletAddress, merchantId, content.id]
      );

      return c.json({ hasAccess: !!purchase });
    } catch (error: any) {
      console.error('Check access error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Generate shareable link (public)
  app.get('/purchases/:purchaseId/shareable-link', async (c) => {
    try {
      const purchaseId = c.req.param('purchaseId');
      const walletAddress = c.req.query('walletAddress');

      if (!walletAddress) {
        return c.json({ error: 'Bad Request', message: 'walletAddress query parameter is required' }, 400);
      }

      // Verify purchase exists and belongs to wallet
      const purchase = await queryOne(
        c.env.DB,
        'SELECT id FROM Purchase WHERE id = ? AND walletAddress = ?',
        [purchaseId, walletAddress]
      );

      if (!purchase) {
        return c.json({ error: 'Not Found', message: 'Purchase not found' }, 404);
      }

      // Generate share token
      const shareToken = crypto.randomUUID() + crypto.randomUUID();
      
      // Store token in KV (expires in 7 days)
      await c.env.CACHE.put(
        `share-token:${shareToken}`,
        JSON.stringify({ purchaseId, walletAddress }),
        { expirationTtl: 7 * 24 * 60 * 60 }
      );

      const shareableLink = `${c.env.FRONTEND_URL}/purchase/${purchaseId}?token=${shareToken}`;

      return c.json({ shareableLink, shareToken });
    } catch (error: any) {
      console.error('Generate shareable link error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Verify shareable access (public)
  app.get('/purchases/share/:purchaseId/verify', async (c) => {
    try {
      const purchaseId = c.req.param('purchaseId');
      const token = c.req.query('token');

      if (!token) {
        return c.json({ error: 'Bad Request', message: 'token query parameter is required' }, 400);
      }

      // Get token from KV
      const tokenData = await c.env.CACHE.get(`share-token:${token}`);
      if (!tokenData) {
        return c.json({ hasAccess: false, message: 'Invalid or expired token' });
      }

      const parsed = JSON.parse(tokenData);
      if (parsed.purchaseId !== purchaseId) {
        return c.json({ hasAccess: false, message: 'Token does not match purchase' });
      }

      // Get purchase details
      const purchase = await queryOne(
        c.env.DB,
        `SELECT Purchase.*, Content.id as content_id, Content.slug, Content.title, Content.description, Content.thumbnailUrl,
                Merchant.id as merchant_id, Merchant.email as merchant_email
         FROM Purchase
         INNER JOIN Content ON Purchase.contentId = Content.id
         INNER JOIN Merchant ON Purchase.merchantId = Merchant.id
         WHERE Purchase.id = ? AND (Purchase.expiresAt IS NULL OR Purchase.expiresAt > datetime('now'))`,
        [purchaseId]
      );

      if (!purchase) {
        return c.json({ hasAccess: false, message: 'Purchase not found or expired' });
      }

      return c.json({
        hasAccess: true,
        purchase: {
          id: purchase.id,
          walletAddress: purchase.walletAddress,
          amount: purchase.amount.toString(),
          currency: purchase.currency,
          expiresAt: purchase.expiresAt,
          createdAt: purchase.createdAt,
          content: {
            id: purchase.content_id,
            slug: purchase.slug,
            title: purchase.title,
            description: purchase.description,
            thumbnailUrl: purchase.thumbnailUrl,
          },
          merchant: {
            id: purchase.merchant_id,
            email: purchase.merchant_email,
          },
        },
      });
    } catch (error: any) {
      console.error('Verify shareable access error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });
}

