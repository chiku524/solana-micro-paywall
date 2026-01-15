import type { KVNamespace } from '@cloudflare/workers-types';

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

/**
 * Improved rate limiting with sliding window algorithm
 * More accurate than fixed window, prevents burst traffic
 */
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
  
  // Get current count with timestamps (sliding window)
  const cached = await kv.get(cacheKey, 'json');
  
  if (!cached || typeof cached !== 'object' || !('requests' in cached) || !('resetAt' in cached)) {
    // First request or expired
    const resetAt = now + config.windowSeconds;
    await kv.put(cacheKey, JSON.stringify({ 
      requests: [now],
      resetAt 
    }), {
      expirationTtl: config.windowSeconds,
    });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }
  
  const requests = (cached as any).requests as number[];
  const resetAt = (cached as any).resetAt as number;
  
  // Remove requests outside the window (sliding window)
  const windowStart = now - config.windowSeconds;
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= config.limit) {
    return { allowed: false, remaining: 0, resetAt };
  }
  
  // Add current request
  validRequests.push(now);
  const newResetAt = Math.max(resetAt, now + config.windowSeconds);
  
  // Update cache
  await kv.put(cacheKey, JSON.stringify({ 
    requests: validRequests,
    resetAt: newResetAt 
  }), {
    expirationTtl: config.windowSeconds,
  });
  
  return { allowed: true, remaining: config.limit - validRequests.length, resetAt: newResetAt };
}

export function getRateLimitKey(identifier: string, endpoint: string): string {
  return `${identifier}:${endpoint}`;
}
