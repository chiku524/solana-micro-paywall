/**
 * Global error handler middleware
 */

import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function errorHandler(err: Error, c: Context) {
  const env = c.env;
  const isDevelopment = env.NODE_ENV === 'development';
  
  // Log error with context
  console.error('Error:', {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message || 'An error occurred',
        status: err.status,
        path: c.req.path,
        timestamp: new Date().toISOString(),
      },
      err.status
    );
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return c.json(
      {
        error: 'Validation Error',
        message: err.message,
        path: c.req.path,
        timestamp: new Date().toISOString(),
      },
      400
    );
  }

  // Handle database errors (D1 specific)
  if (err.message?.includes('SQL') || err.message?.includes('database') || err.message?.includes('D1')) {
    // Don't expose database details in production
    return c.json(
      {
        error: 'Database Error',
        message: isDevelopment ? err.message : 'An error occurred while processing your request',
        path: c.req.path,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }

  // Handle timeout errors
  if (err.message?.includes('timeout') || err.name === 'TimeoutError') {
    return c.json(
      {
        error: 'Request Timeout',
        message: 'The request took too long to process',
        path: c.req.path,
        timestamp: new Date().toISOString(),
      },
      504
    );
  }

  // Generic error response
  return c.json(
    {
      error: 'Internal Server Error',
      message: isDevelopment ? err.message : 'An unexpected error occurred',
      path: c.req.path,
      timestamp: new Date().toISOString(),
    },
    500
  );
}

