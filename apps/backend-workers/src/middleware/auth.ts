/**
 * Authentication middleware for Cloudflare Workers
 */

import { Context, Next } from 'hono';
import { verifyJWT, extractToken } from '../utils/jwt';
import { Env } from '../types/env';

export interface AuthContext {
  merchantId: string;
  email: string;
}

/**
 * JWT authentication middleware
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return c.json({ error: 'Unauthorized', message: 'Missing or invalid token' }, 401);
  }

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    c.set('merchant', {
      merchantId: payload.sub,
      email: payload.email,
    });
    await next();
  } catch (error: any) {
    return c.json(
      { error: 'Unauthorized', message: error.message || 'Invalid token' },
      401
    );
  }
}

/**
 * Optional auth middleware (doesn't fail if no token)
 */
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (token) {
    try {
      const payload = await verifyJWT(token, c.env.JWT_SECRET);
      c.set('merchant', {
        merchantId: payload.sub,
        email: payload.email,
      });
    } catch {
      // Ignore errors for optional auth
    }
  }

  await next();
}

