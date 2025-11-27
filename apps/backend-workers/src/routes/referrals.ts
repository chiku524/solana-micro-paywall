/**
 * Referrals routes
 */

import { Hono } from 'hono';
import { Env } from '../types/env';
import { query, queryOne } from '../utils/db';
import { authMiddleware } from '../middleware/auth';
import { cacheResponse } from '../middleware/cache';

// Generate a unique referral code
function generateCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function referralsRoutes(app: Hono<{ Bindings: Env }>) {
  // Create a referral code (authenticated)
  app.post('/referrals/codes', authMiddleware, async (c) => {
    try {
      const body = await c.req.json();
      const user = c.get('merchant');

      const {
        merchantId,
        referrerWallet,
        discountPercent,
        discountAmount,
        maxUses,
        expiresAt,
        customCode,
      } = body;

      // Merchants can only create codes for themselves
      const finalMerchantId = merchantId || user?.merchantId;
      if (merchantId && merchantId !== user?.merchantId) {
        return c.json({ error: 'Unauthorized', message: 'Cannot create referral code for another merchant' }, 403);
      }

      // Validate discount
      if (discountPercent && (discountPercent < 0 || discountPercent > 100)) {
        return c.json({ error: 'Bad Request', message: 'Discount percent must be between 0 and 100' }, 400);
      }

      if (discountPercent && discountAmount) {
        return c.json({ error: 'Bad Request', message: 'Cannot specify both discountPercent and discountAmount' }, 400);
      }

      if (!discountPercent && !discountAmount) {
        return c.json({ error: 'Bad Request', message: 'Must specify either discountPercent or discountAmount' }, 400);
      }

      // Generate unique code
      let code = customCode;
      if (!code) {
        let attempts = 0;
        let existing;
        do {
          code = generateCode(8);
          attempts++;
          if (attempts > 10) {
            return c.json({ error: 'Internal Server Error', message: 'Failed to generate unique referral code' }, 500);
          }
          existing = await queryOne(
            c.env.DB,
            'SELECT id FROM ReferralCode WHERE code = ?',
            [code]
          );
        } while (existing);
      } else {
        // Check if custom code is available
        const existing = await queryOne(
          c.env.DB,
          'SELECT id FROM ReferralCode WHERE code = ?',
          [code]
        );
        if (existing) {
          return c.json({ error: 'Bad Request', message: `Referral code "${code}" already exists` }, 400);
        }
      }

      // Create referral code
      const result = await queryOne(
        c.env.DB,
        `INSERT INTO ReferralCode (code, merchantId, referrerWallet, discountPercent, discountAmount, maxUses, expiresAt, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         RETURNING *`,
        [
          code,
          finalMerchantId || null,
          referrerWallet || null,
          discountPercent || null,
          discountAmount ? BigInt(discountAmount).toString() : null,
          maxUses || null,
          expiresAt || null,
          true,
        ]
      );

      return c.json({
        ...result,
        discountAmount: result?.discountAmount ? result.discountAmount.toString() : null,
      });
    } catch (error: any) {
      console.error('Create referral code error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get referral code details (public, cached)
  app.get('/referrals/codes/:code', cacheResponse({ ttl: 300 }), async (c) => {
    try {
      const code = c.req.param('code');

      const referralCode = await queryOne(
        c.env.DB,
        `SELECT 
          ReferralCode.*,
          (SELECT COUNT(*) FROM Referral WHERE referralCodeId = ReferralCode.id) as uses
         FROM ReferralCode
         WHERE code = ?`,
        [code]
      );

      if (!referralCode) {
        return c.json({ error: 'Not Found', message: `Referral code not found: ${code}` }, 404);
      }

      // Check if code is still valid
      if (!referralCode.isActive) {
        return c.json({ error: 'Bad Request', message: 'Referral code is inactive' }, 400);
      }

      if (referralCode.expiresAt && new Date(referralCode.expiresAt) < new Date()) {
        return c.json({ error: 'Bad Request', message: 'Referral code has expired' }, 400);
      }

      if (referralCode.maxUses && referralCode.currentUses >= referralCode.maxUses) {
        return c.json({ error: 'Bad Request', message: 'Referral code has reached maximum uses' }, 400);
      }

      return c.json({
        ...referralCode,
        discountAmount: referralCode.discountAmount ? referralCode.discountAmount.toString() : null,
        uses: referralCode.uses || 0,
      });
    } catch (error: any) {
      console.error('Get referral code error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // List referral codes (authenticated)
  app.get('/referrals/codes', authMiddleware, async (c) => {
    try {
      const merchantId = c.req.query('merchantId');
      const referrerWallet = c.req.query('referrerWallet');
      const isActive = c.req.query('isActive');
      const user = c.get('merchant');

      // Merchants can only view their own codes
      const finalMerchantId = merchantId || user?.merchantId;
      if (merchantId && merchantId !== user?.merchantId) {
        return c.json({ error: 'Unauthorized', message: 'Cannot view another merchant\'s referral codes' }, 403);
      }

      const conditions: string[] = [];
      const params: any[] = [];

      if (finalMerchantId) {
        conditions.push('merchantId = ?');
        params.push(finalMerchantId);
      }

      if (referrerWallet) {
        conditions.push('referrerWallet = ?');
        params.push(referrerWallet);
      }

      if (isActive !== undefined) {
        conditions.push('isActive = ?');
        params.push(isActive === 'true' ? 1 : 0);
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      const codes = await query(
        c.env.DB,
        `SELECT 
          ReferralCode.*,
          (SELECT COUNT(*) FROM Referral WHERE referralCodeId = ReferralCode.id) as uses
         FROM ReferralCode
         ${whereClause}
         ORDER BY createdAt DESC`,
        params
      );

      return c.json(codes.map((code: any) => ({
        ...code,
        discountAmount: code.discountAmount ? code.discountAmount.toString() : null,
        uses: code.uses || 0,
      })));
    } catch (error: any) {
      console.error('List referral codes error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Apply referral code to a purchase (public)
  app.post('/referrals/apply', async (c) => {
    try {
      const body = await c.req.json();
      const { code, referrerWallet, refereeWallet, purchaseId, originalAmount } = body;

      // Get referral code
      const referralCode = await queryOne(
        c.env.DB,
        'SELECT * FROM ReferralCode WHERE code = ?',
        [code]
      );

      if (!referralCode) {
        return c.json({ error: 'Not Found', message: `Referral code not found: ${code}` }, 404);
      }

      if (!referralCode.isActive) {
        return c.json({ error: 'Bad Request', message: 'Referral code is inactive' }, 400);
      }

      if (referralCode.expiresAt && new Date(referralCode.expiresAt) < new Date()) {
        return c.json({ error: 'Bad Request', message: 'Referral code has expired' }, 400);
      }

      if (referralCode.maxUses && referralCode.currentUses >= referralCode.maxUses) {
        return c.json({ error: 'Bad Request', message: 'Referral code has reached maximum uses' }, 400);
      }

      // Calculate discount
      const originalAmountBigInt = BigInt(originalAmount);
      let discountAmount = BigInt(0);

      if (referralCode.discountPercent) {
        discountAmount = (originalAmountBigInt * BigInt(referralCode.discountPercent)) / BigInt(100);
      } else if (referralCode.discountAmount) {
        discountAmount = BigInt(referralCode.discountAmount);
      }

      // Ensure discount doesn't exceed original amount
      if (discountAmount > originalAmountBigInt) {
        discountAmount = originalAmountBigInt;
      }

      // Calculate reward for referrer (10% of discount as reward)
      const rewardAmount = discountAmount / BigInt(10);

      // Update referral code usage and create referral record
      await c.env.DB.prepare(
        `UPDATE ReferralCode SET currentUses = currentUses + 1, updatedAt = datetime('now') WHERE id = ?`
      ).bind(referralCode.id).run();

      const referral = await queryOne(
        c.env.DB,
        `INSERT INTO Referral (referralCodeId, referrerWallet, refereeWallet, purchaseId, discountAmount, rewardAmount, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         RETURNING *`,
        [
          referralCode.id,
          referrerWallet,
          refereeWallet,
          purchaseId,
          discountAmount.toString(),
          rewardAmount.toString(),
        ]
      );

      // Invalidate cache
      await c.env.CACHE.delete(`referral:code:${code}`);

      return c.json({
        referral,
        discountAmount: discountAmount.toString(),
        rewardAmount: rewardAmount.toString(),
      });
    } catch (error: any) {
      console.error('Apply referral code error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get referral statistics for a wallet (public, cached)
  app.get('/referrals/stats/:walletAddress', cacheResponse({ ttl: 60 }), async (c) => {
    try {
      const walletAddress = c.req.param('walletAddress');

      const codesCreated = await queryOne<{ count: number }>(
        c.env.DB,
        'SELECT COUNT(*) as count FROM ReferralCode WHERE referrerWallet = ?',
        [walletAddress]
      );

      const referralsMade = await queryOne<{ count: number }>(
        c.env.DB,
        'SELECT COUNT(*) as count FROM Referral WHERE referrerWallet = ?',
        [walletAddress]
      );

      const totalRewards = await queryOne<{ total: string }>(
        c.env.DB,
        'SELECT SUM(rewardAmount) as total FROM Referral WHERE referrerWallet = ?',
        [walletAddress]
      );

      return c.json({
        codesCreated: codesCreated?.count || 0,
        referralsMade: referralsMade?.count || 0,
        totalRewards: totalRewards?.total || '0',
      });
    } catch (error: any) {
      console.error('Get referral stats error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });
}

