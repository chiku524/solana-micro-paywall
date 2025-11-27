/**
 * Response caching middleware using KV
 * Caches GET requests for improved performance
 */

import { Context, Next } from 'hono';
import { Env } from '../types/env';

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
  keyPrefix?: string;
  varyBy?: string[]; // Headers to vary cache by (e.g., ['Authorization'])
}

/**
 * Cache response middleware
 * Caches successful GET responses in KV
 */
export function cacheResponse(options: CacheOptions = {}) {
  const { ttl = 300, keyPrefix = 'cache', varyBy = [] } = options;

  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    // Only cache GET requests
    if (c.req.method !== 'GET') {
      await next();
      return;
    }

    // Build cache key
    const url = new URL(c.req.url);
    const varyHeaders = varyBy
      .map((header) => c.req.header(header) || '')
      .join(':');
    const cacheKey = `${keyPrefix}:${url.pathname}${url.search}${varyHeaders ? `:${varyHeaders}` : ''}`;

    try {
      // Check cache
      const cached = await c.env.CACHE.get(cacheKey, 'json');

      if (cached) {
        // Return cached response
        return c.json(cached, 200, {
          'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl * 2}`,
          'CDN-Cache-Control': `public, s-maxage=${ttl * 2}`,
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
        });
      }

      // Continue to handler
      await next();

      // Cache successful responses
      if (c.res.status === 200) {
        try {
          const response = await c.res.clone().json();
          await c.env.CACHE.put(cacheKey, JSON.stringify(response), {
            expirationTtl: ttl,
          });
          c.res.headers.set('X-Cache', 'MISS');
          c.res.headers.set('X-Cache-Key', cacheKey);
        } catch (error) {
          // If response is not JSON, don't cache
          console.warn('Cache: Response is not JSON, skipping cache:', error);
        }
      }
    } catch (error) {
      // If caching fails, continue without cache (fail open)
      console.error('Cache error:', error);
      await next();
    }
  };
}

/**
 * Invalidate cache for a specific pattern
 */
export async function invalidateCache(
  env: Env,
  pattern: string,
  keyPrefix: string = 'cache'
): Promise<void> {
  // Note: KV doesn't support pattern-based deletion
  // This is a placeholder for future implementation
  // For now, use specific keys or implement a cache versioning strategy
  console.warn('Cache invalidation by pattern not supported in KV');
}

