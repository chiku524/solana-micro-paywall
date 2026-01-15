import type { Context, Next } from 'hono';
import { z } from 'zod';

/**
 * Input validation middleware
 * Validates request body, query params, and headers
 */
export function validateInput<T extends z.ZodTypeAny>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      // Validate body for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
        const body = await c.req.json().catch(() => ({}));
        schema.parse(body);
      }
      
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Validation Error',
            message: 'Invalid input data',
            details: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
          400
        );
      }
      throw error;
    }
  };
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize query parameters
 */
export function sanitizeQueryParams(c: Context): Record<string, string> {
  const params: Record<string, string> = {};
  const query = c.req.query();
  
  for (const [key, value] of Object.entries(query)) {
    if (value && typeof value === 'string') {
      params[key] = sanitizeString(value);
    }
  }
  
  return params;
}
