/**
 * Analytics routes
 */

import { Hono } from 'hono';
import { Env } from '../types/env';
import { query, queryOne } from '../utils/db';
import { authMiddleware } from '../middleware/auth';
import { cacheResponse } from '../middleware/cache';

export function analyticsRoutes(app: Hono<{ Bindings: Env }>) {
  // Get conversion rate for a merchant (authenticated)
  app.get('/analytics/conversion/:merchantId', authMiddleware, async (c) => {
    try {
      const merchantId = c.req.param('merchantId');
      const days = parseInt(c.req.query('days') || '30');
      const user = c.get('merchant');

      // Merchants can only view their own analytics
      if (user && merchantId !== user.merchantId) {
        return c.json({ error: 'Unauthorized', message: 'Cannot view another merchant\'s analytics' }, 403);
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get payment intents count
      const intentsResult = await queryOne<{ count: number }>(
        c.env.DB,
        `SELECT COUNT(*) as count FROM PaymentIntent 
         WHERE merchantId = ? AND createdAt >= ?`,
        [merchantId, startDate.toISOString()]
      );

      // Get confirmed payments count
      const paymentsResult = await queryOne<{ count: number }>(
        c.env.DB,
        `SELECT COUNT(*) as count FROM Payment 
         WHERE intentId IN (SELECT id FROM PaymentIntent WHERE merchantId = ?)
         AND confirmedAt >= ?`,
        [merchantId, startDate.toISOString()]
      );

      const paymentIntents = intentsResult?.count || 0;
      const confirmedPayments = paymentsResult?.count || 0;
      const conversionRate = paymentIntents > 0 ? (confirmedPayments / paymentIntents) * 100 : 0;

      return c.json({
        conversionRate: Number(conversionRate.toFixed(2)),
        totalIntents: paymentIntents,
        confirmedPayments,
        period: days,
      });
    } catch (error: any) {
      console.error('Get conversion rate error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get top content by sales (public, cached)
  app.get('/analytics/top-content', cacheResponse({ ttl: 600 }), async (c) => {
    try {
      const merchantId = c.req.query('merchantId');
      const limit = parseInt(c.req.query('limit') || '10');

      let where = "Content.visibility = 'public'";
      const params: any[] = [];

      if (merchantId) {
        where += ' AND Content.merchantId = ?';
        params.push(merchantId);
      }

      where += " AND Merchant.status = 'active'";

      const topContent = await query(
        c.env.DB,
        `SELECT 
          Content.id,
          Content.title,
          Content.slug,
          Content.priceLamports,
          Content.currency,
          Content.viewCount,
          Content.purchaseCount,
          Merchant.id as merchant_id,
          Merchant.email as merchant_email,
          Merchant.displayName as merchant_displayName,
          (SELECT COUNT(*) FROM Purchase WHERE contentId = Content.id) as purchase_count
         FROM Content
         INNER JOIN Merchant ON Content.merchantId = Merchant.id
         WHERE ${where}
         ORDER BY Content.purchaseCount DESC
         LIMIT ?`,
        [...params, limit]
      );

      const result = topContent.map((content: any) => ({
        id: content.id,
        title: content.title || content.slug,
        merchant: {
          id: content.merchant_id,
          email: content.merchant_email,
          displayName: content.merchant_displayName,
        },
        purchaseCount: content.purchase_count || content.purchaseCount || 0,
        viewCount: content.viewCount || 0,
        priceLamports: content.priceLamports?.toString() || '0',
        currency: content.currency || 'SOL',
      }));

      return c.json(result);
    } catch (error: any) {
      console.error('Get top content error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get merchant performance metrics (authenticated)
  app.get('/analytics/performance/:merchantId', authMiddleware, async (c) => {
    try {
      const merchantId = c.req.param('merchantId');
      const days = parseInt(c.req.query('days') || '30');
      const user = c.get('merchant');

      // Merchants can only view their own analytics
      if (user && merchantId !== user.merchantId) {
        return c.json({ error: 'Unauthorized', message: 'Cannot view another merchant\'s analytics' }, 403);
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get total revenue
      const revenueResult = await queryOne<{ total: string }>(
        c.env.DB,
        `SELECT SUM(Payment.amount) as total FROM Payment
         INNER JOIN PaymentIntent ON Payment.intentId = PaymentIntent.id
         WHERE PaymentIntent.merchantId = ? AND Payment.confirmedAt >= ?`,
        [merchantId, startDate.toISOString()]
      );

      // Get total sales
      const salesResult = await queryOne<{ count: number }>(
        c.env.DB,
        `SELECT COUNT(*) as count FROM Purchase
         WHERE merchantId = ? AND purchasedAt >= ?`,
        [merchantId, startDate.toISOString()]
      );

      // Get total content
      const contentResult = await queryOne<{ count: number }>(
        c.env.DB,
        `SELECT COUNT(*) as count FROM Content WHERE merchantId = ?`,
        [merchantId]
      );

      // Get total followers
      const followersResult = await queryOne<{ count: number }>(
        c.env.DB,
        `SELECT COUNT(*) as count FROM MerchantFollow WHERE merchantId = ?`,
        [merchantId]
      );

      // Get conversion rate
      const intentsResult = await queryOne<{ count: number }>(
        c.env.DB,
        `SELECT COUNT(*) as count FROM PaymentIntent 
         WHERE merchantId = ? AND createdAt >= ?`,
        [merchantId, startDate.toISOString()]
      );

      const paymentsResult = await queryOne<{ count: number }>(
        c.env.DB,
        `SELECT COUNT(*) as count FROM Payment 
         WHERE intentId IN (SELECT id FROM PaymentIntent WHERE merchantId = ?)
         AND confirmedAt >= ?`,
        [merchantId, startDate.toISOString()]
      );

      const totalRevenue = revenueResult?.total || '0';
      const totalSales = salesResult?.count || 0;
      const totalContent = contentResult?.count || 0;
      const totalFollowers = followersResult?.count || 0;
      const paymentIntents = intentsResult?.count || 0;
      const confirmedPayments = paymentsResult?.count || 0;
      const conversionRate = paymentIntents > 0 ? (confirmedPayments / paymentIntents) * 100 : 0;

      const revenueNum = BigInt(totalRevenue);
      const avgRevenuePerSale = totalSales > 0
        ? (Number(revenueNum) / totalSales / 1e9).toFixed(4)
        : '0';

      return c.json({
        period: days,
        totalRevenue: totalRevenue,
        totalSales,
        totalContent,
        totalFollowers,
        conversionRate: Number(conversionRate.toFixed(2)),
        avgRevenuePerSale,
      });
    } catch (error: any) {
      console.error('Get merchant performance error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });
}

