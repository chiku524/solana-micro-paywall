/**
 * Merchants routes
 */

import { Hono } from 'hono';
import { Env } from '../types/env';
import { query, queryOne, execute, parseJsonField, stringifyJsonField } from '../utils/db';
import { isValidAddress } from '../utils/solana';
import { authMiddleware } from '../middleware/auth';

function generateId(): string {
  return crypto.randomUUID();
}

export function merchantsRoutes(app: Hono<{ Bindings: Env }>) {
  // Create merchant (public)
  app.post('/merchants', async (c) => {
    try {
      const body = await c.req.json();
      const { email, payoutAddress, webhookSecret } = body;

      if (!email) {
        return c.json({ error: 'Bad Request', message: 'email is required' }, 400);
      }

      // Check if merchant exists
      const existing = await queryOne<{ id: string; status: string }>(
        c.env.DB,
        'SELECT id, status FROM Merchant WHERE email = ?',
        [email]
      );

      if (existing) {
        // Auto-activate pending merchants
        if (existing.status === 'pending') {
          await execute(c.env.DB, 'UPDATE Merchant SET status = ? WHERE id = ?', ['active', existing.id]);
          existing.status = 'active';
        }
        const merchant = await queryOne(c.env.DB, 'SELECT * FROM Merchant WHERE id = ?', [existing.id]);
        return c.json(merchant);
      }

      // Validate payout address
      if (payoutAddress && !isValidAddress(payoutAddress)) {
        return c.json({ error: 'Bad Request', message: `Invalid Solana address: ${payoutAddress}` }, 400);
      }

      // Generate webhook secret
      const finalWebhookSecret = webhookSecret || crypto.randomUUID() + crypto.randomUUID();

      const merchantId = generateId();
      await execute(
        c.env.DB,
        `INSERT INTO Merchant (id, email, payoutAddress, webhookSecret, status, configJson, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [merchantId, email, payoutAddress || null, finalWebhookSecret, 'active', '{}']
      );

      const merchant = await queryOne(c.env.DB, 'SELECT * FROM Merchant WHERE id = ?', [merchantId]);
      return c.json(merchant);
    } catch (error: any) {
      console.error('Create merchant error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // List merchants (public)
  app.get('/merchants', async (c) => {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const status = c.req.query('status');
      const search = c.req.query('search');
      const skip = (page - 1) * limit;

      let where = '1=1';
      const params: any[] = [];

      if (status) {
        where += ' AND status = ?';
        params.push(status);
      }
      if (search) {
        where += ' AND email LIKE ?';
        params.push(`%${search}%`);
      }

      const merchants = await query(
        c.env.DB,
        `SELECT * FROM Merchant WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      );

      const totalResult = await queryOne<{ count: number }>(
        c.env.DB,
        `SELECT COUNT(*) as count FROM Merchant WHERE ${where}`,
        params
      );
      const total = totalResult?.count || 0;

      return c.json({
        data: merchants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('List merchants error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get merchant (protected)
  app.get('/merchants/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const merchant = c.get('merchant');

      if (id !== merchant.merchantId) {
        return c.json({ error: 'Unauthorized', message: 'Cannot access another merchant\'s data' }, 403);
      }

      const result = await queryOne(c.env.DB, 'SELECT * FROM Merchant WHERE id = ?', [id]);
      if (!result) {
        return c.json({ error: 'Not Found', message: 'Merchant not found' }, 404);
      }

      return c.json(result);
    } catch (error: any) {
      console.error('Get merchant error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get merchant dashboard (protected)
  app.get('/merchants/:id/dashboard', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const merchant = c.get('merchant');

      if (id !== merchant.merchantId) {
        return c.json({ error: 'Unauthorized', message: 'Cannot access another merchant\'s dashboard' }, 403);
      }

      // Get stats
      const [contentsCount, paymentsCount, purchasesCount] = await Promise.all([
        queryOne<{ count: number }>(c.env.DB, 'SELECT COUNT(*) as count FROM Content WHERE merchantId = ?', [id]),
        queryOne<{ count: number }>(c.env.DB, 'SELECT COUNT(*) as count FROM Payment WHERE merchantId = ?', [id]),
        queryOne<{ count: number }>(c.env.DB, 'SELECT COUNT(*) as count FROM Purchase WHERE merchantId = ?', [id]),
      ]);

      const totalRevenue = await queryOne<{ total: number }>(
        c.env.DB,
        'SELECT SUM(amount) as total FROM Payment WHERE merchantId = ? AND status = ?',
        [id, 'confirmed']
      );

      return c.json({
        merchantId: id,
        stats: {
          contents: contentsCount?.count || 0,
          payments: paymentsCount?.count || 0,
          purchases: purchasesCount?.count || 0,
          totalRevenue: totalRevenue?.total || 0,
        },
      });
    } catch (error: any) {
      console.error('Get dashboard error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Update merchant (protected)
  app.put('/merchants/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const merchant = c.get('merchant');
      const body = await c.req.json();

      if (id !== merchant.merchantId) {
        return c.json({ error: 'Unauthorized', message: 'Cannot update another merchant\'s data' }, 403);
      }

      // Validate payout address if provided
      if (body.payoutAddress && !isValidAddress(body.payoutAddress)) {
        return c.json({ error: 'Bad Request', message: `Invalid Solana address: ${body.payoutAddress}` }, 400);
      }

      // Build update query
      const updates: string[] = [];
      const params: any[] = [];

      if (body.payoutAddress !== undefined) {
        updates.push('payoutAddress = ?');
        params.push(body.payoutAddress);
      }
      if (body.displayName !== undefined) {
        updates.push('displayName = ?');
        params.push(body.displayName);
      }
      if (body.bio !== undefined) {
        updates.push('bio = ?');
        params.push(body.bio);
      }
      if (body.avatarUrl !== undefined) {
        updates.push('avatarUrl = ?');
        params.push(body.avatarUrl);
      }
      if (body.websiteUrl !== undefined) {
        updates.push('websiteUrl = ?');
        params.push(body.websiteUrl);
      }
      if (body.twitterUrl !== undefined) {
        updates.push('twitterUrl = ?');
        params.push(body.twitterUrl);
      }
      if (body.telegramUrl !== undefined) {
        updates.push('telegramUrl = ?');
        params.push(body.telegramUrl);
      }
      if (body.discordUrl !== undefined) {
        updates.push('discordUrl = ?');
        params.push(body.discordUrl);
      }
      if (body.githubUrl !== undefined) {
        updates.push('githubUrl = ?');
        params.push(body.githubUrl);
      }

      if (updates.length === 0) {
        return c.json({ error: 'Bad Request', message: 'No fields to update' }, 400);
      }

      updates.push('updatedAt = datetime(\'now\')');
      params.push(id);

      await execute(
        c.env.DB,
        `UPDATE Merchant SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      const updated = await queryOne(c.env.DB, 'SELECT * FROM Merchant WHERE id = ?', [id]);
      return c.json(updated);
    } catch (error: any) {
      console.error('Update merchant error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get public profile (public)
  app.get('/merchants/:id/public-profile', async (c) => {
    try {
      const id = c.req.param('id');

      const merchant = await queryOne(c.env.DB, 'SELECT * FROM Merchant WHERE id = ?', [id]);
      if (!merchant) {
        return c.json({ error: 'Not Found', message: 'Merchant not found' }, 404);
      }

      // Get follower count
      const followerCount = await queryOne<{ count: number }>(
        c.env.DB,
        'SELECT COUNT(*) as count FROM MerchantFollow WHERE merchantId = ?',
        [id]
      );

      // Get content count
      const contentCount = await queryOne<{ count: number }>(
        c.env.DB,
        'SELECT COUNT(*) as count FROM Content WHERE merchantId = ? AND visibility = ?',
        [id, 'public']
      );

      return c.json({
        ...merchant,
        followerCount: followerCount?.count || 0,
        contentCount: contentCount?.count || 0,
      });
    } catch (error: any) {
      console.error('Get public profile error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Follow merchant (public)
  app.post('/merchants/:id/follow', async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const { walletAddress } = body;

      if (!walletAddress) {
        return c.json({ error: 'Bad Request', message: 'walletAddress is required' }, 400);
      }

      // Check if already following
      const existing = await queryOne(
        c.env.DB,
        'SELECT id FROM MerchantFollow WHERE walletAddress = ? AND merchantId = ?',
        [walletAddress, id]
      );

      if (existing) {
        return c.json({ message: 'Already following', isFollowing: true });
      }

      const followId = generateId();
      await execute(
        c.env.DB,
        'INSERT INTO MerchantFollow (id, walletAddress, merchantId, createdAt) VALUES (?, ?, ?, datetime(\'now\'))',
        [followId, walletAddress, id]
      );

      return c.json({ message: 'Followed successfully', isFollowing: true });
    } catch (error: any) {
      console.error('Follow merchant error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Unfollow merchant (public)
  app.post('/merchants/:id/unfollow', async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const { walletAddress } = body;

      if (!walletAddress) {
        return c.json({ error: 'Bad Request', message: 'walletAddress is required' }, 400);
      }

      await execute(
        c.env.DB,
        'DELETE FROM MerchantFollow WHERE walletAddress = ? AND merchantId = ?',
        [walletAddress, id]
      );

      return c.json({ message: 'Unfollowed successfully', isFollowing: false });
    } catch (error: any) {
      console.error('Unfollow merchant error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get follow status (public)
  app.get('/merchants/:id/follow-status', async (c) => {
    try {
      const id = c.req.param('id');
      const walletAddress = c.req.query('walletAddress');

      if (!walletAddress) {
        return c.json({ error: 'Bad Request', message: 'walletAddress query parameter is required' }, 400);
      }

      const isFollowing = await queryOne(
        c.env.DB,
        'SELECT id FROM MerchantFollow WHERE walletAddress = ? AND merchantId = ?',
        [walletAddress, id]
      );

      const followerCount = await queryOne<{ count: number }>(
        c.env.DB,
        'SELECT COUNT(*) as count FROM MerchantFollow WHERE merchantId = ?',
        [id]
      );

      return c.json({
        isFollowing: !!isFollowing,
        followerCount: followerCount?.count || 0,
      });
    } catch (error: any) {
      console.error('Get follow status error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });
}

