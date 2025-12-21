import { Hono } from 'hono';
import type { Env } from '../types';
import { createJWT } from '../lib/jwt';
import { getMerchantById } from '../lib/db';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

const loginSchema = z.object({
  merchantId: z.string().min(1),
});

app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { merchantId } = loginSchema.parse(body);
    
    const merchant = await getMerchantById(c.env.DB, merchantId);
    if (!merchant) {
      return c.json({ error: 'Not Found', message: 'Merchant not found' }, 404);
    }
    
    if (merchant.status !== 'active') {
      return c.json({ error: 'Forbidden', message: 'Merchant account is not active' }, 403);
    }
    
    const jwtSecret = c.env.JWT_SECRET;
    const signJWT = createJWT(jwtSecret);
    const token = await signJWT({
      merchantId: merchant.id,
      type: 'merchant',
    }, '24h');
    
    return c.json({
      token,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        displayName: merchant.displayName,
        bio: merchant.bio,
        avatarUrl: merchant.avatarUrl,
        payoutAddress: merchant.payoutAddress,
        status: merchant.status,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

export default app;
