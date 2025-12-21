import type { Context, Next } from 'hono';
import { verifyJWT } from '../lib/jwt';
import type { Env } from '../types';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', message: 'Missing or invalid authorization header' }, 401);
  }
  
  const token = authHeader.substring(7);
  const jwtSecret = c.env.JWT_SECRET;
  
  try {
    const payload = await verifyJWT(jwtSecret)(token);
    
    if (payload.type !== 'merchant' || !payload.merchantId) {
      return c.json({ error: 'Unauthorized', message: 'Invalid token type' }, 401);
    }
    
    // Attach merchant ID to context
    c.set('merchantId', payload.merchantId as string);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401);
  }
}
