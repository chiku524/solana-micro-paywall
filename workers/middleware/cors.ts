import type { Context } from 'hono';

export function corsMiddleware(c: Context) {
  const origin = c.req.header('Origin');
  const allowedOrigins = c.env.NEXT_PUBLIC_WEB_URL 
    ? [c.env.NEXT_PUBLIC_WEB_URL, 'http://localhost:3000']
    : ['http://localhost:3000', '*'];
  
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0] === '*' ? '*' : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
