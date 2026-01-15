import type { Context, Next } from 'hono';

/**
 * Request timeout middleware
 * Ensures requests don't hang indefinitely
 */
export async function requestTimeoutMiddleware(c: Context, next: Next, timeoutMs: number = 30000) {
  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);
  });
  
  try {
    await Promise.race([
      next(),
      timeoutPromise,
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timeout') {
      return c.json(
        { error: 'Request Timeout', message: 'The request took too long to process' },
        408
      );
    }
    throw error;
  }
}
