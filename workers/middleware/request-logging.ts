import type { Context, Next } from 'hono';

/**
 * Request logging middleware
 * Logs request details for monitoring and debugging
 */
export async function requestLoggingMiddleware(c: Context, next: Next) {
  const startTime = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';
  
  try {
    await next();
    
    const duration = Date.now() - startTime;
    const status = c.res.status;
    
    // Log request (only log errors and slow requests in production)
    if (status >= 400 || duration > 1000) {
      console.log(JSON.stringify({
        method,
        path,
        status,
        duration,
        ip,
        userAgent: userAgent.substring(0, 100), // Truncate long user agents
        timestamp: new Date().toISOString(),
      }));
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(JSON.stringify({
      method,
      path,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      ip,
      timestamp: new Date().toISOString(),
    }));
    throw error;
  }
}
