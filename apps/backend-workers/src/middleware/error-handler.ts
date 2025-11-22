/**
 * Global error handler middleware
 */

import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  // Handle HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message || 'An error occurred',
        status: err.status,
        path: c.req.path,
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
      },
      400
    );
  }

  // Handle database errors
  if (err.message?.includes('SQL') || err.message?.includes('database')) {
    return c.json(
      {
        error: 'Database Error',
        message: 'An error occurred while processing your request',
        path: c.req.path,
      },
      500
    );
  }

  // Generic error response
  return c.json(
    {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
      path: c.req.path,
    },
    500
  );
}

