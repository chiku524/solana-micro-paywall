import type { Context } from 'hono';

export function corsMiddleware(c: Context) {
  const origin = c.req.header('Origin');
  
  // Always allow production domain and localhost for development
  const allowedOrigins = [
    'https://micropaywall.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  
  // Also add environment variable if set (for additional allowed origins)
  if (c.env.NEXT_PUBLIC_WEB_URL && !allowedOrigins.includes(c.env.NEXT_PUBLIC_WEB_URL)) {
    allowedOrigins.push(c.env.NEXT_PUBLIC_WEB_URL);
  }
  
  // Check if the origin is in the allowed list
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0]; // Default to production domain
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
