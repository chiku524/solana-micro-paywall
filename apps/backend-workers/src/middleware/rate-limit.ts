/**
 * Rate limiting middleware using KV
 */

import { Context, Next } from 'hono';
import { Env } from '../types/env';

interface RateLimitOptions {
  limit: number;
  window: number; // seconds
  keyPrefix?: string;
}

/**
 * Rate limit middleware
 */
export function rateLimit(options: RateLimitOptions) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const key = `${options.keyPrefix || 'rate-limit'}:${c.req.header('CF-Connecting-IP') || 'unknown'}`;
    const kv = c.env.CACHE;

    try {
      const count = await kv.get(key);
      const currentCount = count ? parseInt(count, 10) : 0;

      if (currentCount >= options.limit) {
        return c.json(
          {
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Limit: ${options.limit} requests per ${options.window} seconds`,
          },
          429
        );
      }

      // Increment counter
      await kv.put(key, (currentCount + 1).toString(), {
        expirationTtl: options.window,
      });

      await next();
    } catch (error) {
      // If KV fails, allow request (fail open)
      console.error('Rate limit error:', error);
      await next();
    }
  };
}

