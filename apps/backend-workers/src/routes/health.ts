/**
 * Health check routes
 * Public endpoint for monitoring and status checks
 */

import { Context } from 'hono';
import { Env } from '../types/env';

export const healthRoutes = [
  async (c: Context<{ Bindings: Env }>) => {
  const env = c.env;
  
  try {
    // Test database connection
    const dbTest = await env.DB.prepare('SELECT 1 as test').first();
    const dbStatus = dbTest ? 'connected' : 'error';
    
    // Test KV connection
    let kvStatus = 'connected';
    try {
      await env.CACHE.put('health-check', 'ok', { expirationTtl: 60 });
      await env.CACHE.get('health-check');
    } catch {
      kvStatus = 'error';
    }
    
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: dbStatus,
        cache: kvStatus,
      },
      environment: env.NODE_ENV || 'development',
    });
  } catch (error) {
    return c.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
  }
];

