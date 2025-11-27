/**
 * Security headers middleware
 * Adds security headers to all responses
 */

import { Context, Next } from 'hono';
import { Env } from '../types/env';

/**
 * Security headers middleware
 * Adds comprehensive security headers to responses
 */
export function securityHeaders() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    await next();

    // Security headers
    c.res.headers.set('X-Content-Type-Options', 'nosniff');
    c.res.headers.set('X-Frame-Options', 'DENY');
    c.res.headers.set('X-XSS-Protection', '1; mode=block');
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.res.headers.set(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()'
    );

    // HSTS (only for HTTPS)
    if (c.req.url.startsWith('https://')) {
      c.res.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Content Security Policy (adjust based on your needs)
    const isProduction = c.env.NODE_ENV === 'production';
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust based on your needs
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.micropaywall.app https://api.mainnet-beta.solana.com https://api.devnet.solana.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    c.res.headers.set('Content-Security-Policy', csp);

    // Remove server information
    c.res.headers.delete('Server');
    c.res.headers.delete('X-Powered-By');
  };
}

