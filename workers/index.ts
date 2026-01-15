import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { corsMiddleware } from './middleware/cors';
import { securityHeadersMiddleware } from './middleware/security-headers';
import { requestLoggingMiddleware } from './middleware/request-logging';
import { requestTimeoutMiddleware } from './middleware/request-timeout';

// Import route handlers
import merchantsRoutes from './routes/merchants';
import authRoutes from './routes/auth';
import securityRoutes from './routes/security';
import contentsRoutes from './routes/contents';
import paymentsRoutes from './routes/payments';
import purchasesRoutes from './routes/purchases';
import discoverRoutes from './routes/discover';
import bookmarksRoutes from './routes/bookmarks';
import analyticsRoutes from './routes/analytics';

const app = new Hono<{ Bindings: Env }>();

// Global middleware (order matters!)
app.use('*', requestLoggingMiddleware);
app.use('*', securityHeadersMiddleware);
app.use('*', async (c, next) => requestTimeoutMiddleware(c, next, 30000)); // 30 second timeout

// Global CORS middleware
app.use('*', async (c, next) => {
  const corsHeaders = corsMiddleware(c);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    c.header(key, value);
  });
  
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }
  
  await next();
});

// Enhanced health check with metrics
app.get('/health', async (c) => {
  const health: any = {
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime ? process.uptime() : 0,
  };
  
  // Check database connectivity
  try {
    if (c.env.DB) {
      const start = Date.now();
      await c.env.DB.prepare('SELECT 1').first();
      health.database = {
        status: 'ok',
        latency: Date.now() - start,
      };
    } else {
      health.database = { status: 'not_configured' };
    }
  } catch (error) {
    health.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
  
  // Check KV connectivity
  try {
    if (c.env.CACHE) {
      const start = Date.now();
      await c.env.CACHE.get('health_check');
      health.cache = {
        status: 'ok',
        latency: Date.now() - start,
      };
    } else {
      health.cache = { status: 'not_configured' };
    }
  } catch (error) {
    health.cache = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
  
  const statusCode = health.database?.status === 'ok' && health.cache?.status !== 'error' ? 200 : 503;
  return c.json(health, statusCode);
});

// API routes
app.route('/api/merchants', merchantsRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/security', securityRoutes);
app.route('/api/contents', contentsRoutes);
app.route('/api/payments', paymentsRoutes);
app.route('/api/purchases', purchasesRoutes);
app.route('/api/discover', discoverRoutes);
app.route('/api/bookmarks', bookmarksRoutes);
app.route('/api/analytics', analyticsRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested resource was not found' }, 404);
});

// Error handler with better error reporting
app.onError((err, c) => {
  const errorId = crypto.randomUUID();
  const path = c.req.path;
  const method = c.req.method;
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  
  // Log error with context
  console.error(JSON.stringify({
    errorId,
    error: err.message,
    stack: err.stack,
    path,
    method,
    ip,
    timestamp: new Date().toISOString(),
  }));
  
  // Don't expose internal error details in production
  const isDevelopment = c.env.NODE_ENV === 'development';
  const message = isDevelopment 
    ? err.message || 'An unexpected error occurred'
    : 'An unexpected error occurred. Please try again later.';
  
  return c.json(
    { 
      error: 'Internal Server Error',
      message,
      ...(isDevelopment && { errorId, details: err.stack }),
    },
    500
  );
});

export default app;
