import type { KVNamespace } from '@cloudflare/workers-types';

/**
 * Cache utility with TTL support
 */
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

/**
 * Get value from cache
 */
export async function getCache<T>(
  kv: KVNamespace | undefined,
  key: string
): Promise<T | null> {
  if (!kv) return null;
  
  try {
    const value = await kv.get(key, 'json');
    return value as T | null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set value in cache with optional TTL
 */
export async function setCache(
  kv: KVNamespace | undefined,
  key: string,
  value: any,
  options?: CacheOptions
): Promise<boolean> {
  if (!kv) return false;
  
  try {
    const serialized = JSON.stringify(value);
    const putOptions: { expirationTtl?: number } = {};
    
    if (options?.ttl) {
      putOptions.expirationTtl = options.ttl;
    }
    
    await kv.put(key, serialized, putOptions);
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(
  kv: KVNamespace | undefined,
  key: string
): Promise<boolean> {
  if (!kv) return false;
  
  try {
    await kv.delete(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  content: (id: string) => `content:${id}`,
  merchant: (id: string) => `merchant:${id}`,
  contentList: (merchantId: string, page: number, limit: number) => 
    `content:list:${merchantId}:${page}:${limit}`,
  stats: (merchantId: string) => `stats:${merchantId}`,
};
