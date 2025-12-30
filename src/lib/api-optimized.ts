// Optimized API client with retry logic and request deduplication

import { ApiError } from './api';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Request cache for deduplication
const requestCache = new Map<string, Promise<any>>();

// Exponential backoff delay
function getRetryDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function apiGetWithRetry<T>(
  endpoint: string,
  token?: string,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries,
    retryDelay,
    retryableStatuses,
  } = { ...DEFAULT_RETRY_OPTIONS, ...options };

  // Create cache key for deduplication
  const cacheKey = `${endpoint}:${token || 'no-token'}`;
  
  // Check if there's already a pending request
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  const makeRequest = async (attempt: number = 0): Promise<T> => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.micropaywall.app'}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          data = {};
        }
      } else {
        data = {};
      }

      if (!response.ok) {
        // Check if we should retry
        if (
          attempt < maxRetries &&
          retryableStatuses.includes(response.status)
        ) {
          const delay = getRetryDelay(attempt, retryDelay);
          await sleep(delay);
          return makeRequest(attempt + 1);
        }

        throw new ApiError(
          response.status,
          data.error || `HTTP ${response.status}`,
          data.message || response.statusText || 'An error occurred'
        );
      }

      // Clear cache on success
      requestCache.delete(cacheKey);
      return data;
    } catch (error) {
      // Clear cache on error
      requestCache.delete(cacheKey);
      
      // Retry on network errors
      if (attempt < maxRetries && error instanceof TypeError) {
        const delay = getRetryDelay(attempt, retryDelay);
        await sleep(delay);
        return makeRequest(attempt + 1);
      }

      throw error;
    }
  };

  // Create and cache the request promise
  const requestPromise = makeRequest();
  requestCache.set(cacheKey, requestPromise);

  // Clean up cache after request completes (success or failure)
  requestPromise.finally(() => {
    // Keep in cache for a short time to handle rapid duplicate requests
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, 100);
  });

  return requestPromise;
}

// Clear cache utility (useful for testing or manual cache invalidation)
export function clearApiCache(): void {
  requestCache.clear();
}


