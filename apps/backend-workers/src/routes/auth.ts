/**
 * Auth routes
 */

import { Hono } from 'hono';
import { Env } from '../types/env';
import { signJWT } from '../utils/jwt';
import { queryOne } from '../utils/db';

export function authRoutes(app: Hono<{ Bindings: Env }>) {
  // Login
  app.post('/auth/login', async (c) => {
    try {
      const body = await c.req.json();
      const { merchantId } = body;

      if (!merchantId) {
        return c.json({ error: 'Bad Request', message: 'merchantId is required' }, 400);
      }

      // Get merchant from database
      const merchant = await queryOne<{
        id: string;
        email: string;
        status: string;
      }>(
        c.env.DB,
        'SELECT id, email, status FROM Merchant WHERE id = ?',
        [merchantId]
      );

      if (!merchant) {
        return c.json({ error: 'Unauthorized', message: 'Merchant not found' }, 401);
      }

      // Auto-activate pending merchants for development/testing
      if (merchant.status === 'pending') {
        await c.env.DB.prepare('UPDATE Merchant SET status = ? WHERE id = ?')
          .bind('active', merchantId)
          .run();
        merchant.status = 'active';
      }

      if (merchant.status !== 'active') {
        return c.json(
          { error: 'Unauthorized', message: `Merchant status is ${merchant.status}, must be active` },
          401
        );
      }

      // Generate JWT
      const accessToken = await signJWT(
        {
          sub: merchant.id,
          email: merchant.email,
        },
        c.env.JWT_SECRET,
        86400 // 24 hours
      );

      return c.json({
        accessToken,
        merchant: {
          id: merchant.id,
          email: merchant.email,
          status: merchant.status,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });
}

