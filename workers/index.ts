import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { corsMiddleware } from './middleware/cors';

// Import route handlers
import merchantsRoutes from './routes/merchants';
import authRoutes from './routes/auth';
import contentsRoutes from './routes/contents';
import paymentsRoutes from './routes/payments';
import purchasesRoutes from './routes/purchases';
import discoverRoutes from './routes/discover';
import bookmarksRoutes from './routes/bookmarks';
import analyticsRoutes from './routes/analytics';

const app = new Hono<{ Bindings: Env }>();

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

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// API routes
app.route('/api/merchants', merchantsRoutes);
app.route('/api/auth', authRoutes);
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

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    { 
      error: 'Internal Server Error', 
      message: err.message || 'An unexpected error occurred' 
    },
    500
  );
});

export default app;
