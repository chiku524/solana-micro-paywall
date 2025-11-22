/**
 * Cloudflare Workers Backend - Main Entry Point
 * 
 * This is the main entry point for the Cloudflare Workers backend.
 * Routes API requests to appropriate handlers.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { Env } from './types/env';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes } from './routes/health';

// Create Hono app with environment bindings
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: (origin, c) => {
    const env = c.env;
    const allowedOrigins = env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['*'];
    
    // Allow all in development
    if (env.NODE_ENV === 'development' || allowedOrigins.includes('*')) {
      return origin || '*';
    }
    
    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      return origin;
    }
    
    // Default: allow if no origin (same-origin requests)
    return origin || env.FRONTEND_URL || '*';
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Global error handler
app.onError(errorHandler);

// Health check (public, no auth required)
app.get('/health', ...healthRoutes);

// API routes
const api = new Hono<{ Bindings: Env }>();

// API prefix
api.get('/', (c) => {
  return c.json({
    name: 'Solana Micro-Paywall API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      docs: '/api/docs', // Will add Swagger/OpenAPI later
    },
  });
});

// Mount API routes
app.route('/api', api);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
      path: c.req.path,
    },
    404
  );
});

// Export default handler for Cloudflare Workers
export default {
  fetch: app.fetch,
  
  // Queue consumers for background jobs
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const body = message.body as any;
        
        // Route to appropriate queue processor
        if (message.queue === 'payment-verification') {
          await processPaymentVerification(body, env);
        } else if (message.queue === 'webhooks') {
          await processWebhook(body, env);
        }
        
        message.ack();
      } catch (error) {
        console.error(`Queue processing error for ${message.queue}:`, error);
        // Retry on error (Cloudflare will handle retries)
        message.retry();
      }
    }
  },
};

// Queue processors (will be implemented in separate files)
async function processPaymentVerification(data: any, env: Env): Promise<void> {
  // TODO: Implement payment verification logic
  // Ported from apps/backend/src/modules/jobs/payment-verification.processor.ts
  console.log('Processing payment verification:', data);
}

async function processWebhook(data: any, env: Env): Promise<void> {
  // TODO: Implement webhook delivery logic
  // Ported from apps/backend/src/modules/jobs/webhook.processor.ts
  console.log('Processing webhook:', data);
}

