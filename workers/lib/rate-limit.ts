import type { KVNamespace } from '@cloudflare/workers-types';

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

export async function checkRateLimit(
  kv: KVNamespace | undefined,
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // If KV is not available, allow the request (fail open)
  if (!kv) {
    console.warn('KV namespace not available, skipping rate limiting');
    return { allowed: true, remaining: config.limit, resetAt: Math.floor(Date.now() / 1000) + config.windowSeconds };
  }
  
  const cacheKey = `ratelimit:${key}`;
  const now = Math.floor(Date.now() / 1000);
  
  // Get current count
  const cached = await kv.get(cacheKey, 'json');
  
  if (!cached || typeof cached !== 'object' || !('count' in cached) || !('resetAt' in cached)) {
    // First request or expired
    const resetAt = now + config.windowSeconds;
    await kv.put(cacheKey, JSON.stringify({ count: 1, resetAt }), {
      expirationTtl: config.windowSeconds,
    });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }
  
  const count = (cached as any).count as number;
  const resetAt = (cached as any).resetAt as number;
  
  if (now >= resetAt) {
    // Window expired, reset
    const newResetAt = now + config.windowSeconds;
    await kv.put(cacheKey, JSON.stringify({ count: 1, resetAt: newResetAt }), {
      expirationTtl: config.windowSeconds,
    });
    return { allowed: true, remaining: config.limit - 1, resetAt: newResetAt };
  }
  
  if (count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt };
  }
  
  // Increment count
  await kv.put(cacheKey, JSON.stringify({ count: count + 1, resetAt }), {
    expirationTtl: resetAt - now,
  });
  
  return { allowed: true, remaining: config.limit - count - 1, resetAt };
}

export function getRateLimitKey(identifier: string, endpoint: string): string {
  return `${identifier}:${endpoint}`;
}
