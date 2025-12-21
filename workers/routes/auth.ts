import { Hono } from 'hono';
import type { Env } from '../types';
import { createJWT } from '../lib/jwt';
import { getMerchantById, getMerchantByEmail } from '../lib/db';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

const loginSchema = z.object({
  email: z.string().email().optional(),
  merchantId: z.string().optional(),
}).refine((data) => data.email || data.merchantId, {
  message: 'Either email or merchantId must be provided',
});

app.post('/login', async (c) => {
  try {
    // Validate bindings are available
    if (!c.env.DB) {
      return c.json({ error: 'Configuration Error', message: 'Database binding not configured' }, 500);
    }
    if (!c.env.JWT_SECRET) {
      return c.json({ error: 'Configuration Error', message: 'JWT secret not configured' }, 500);
    }
    
    const body = await c.req.json();
    const { email, merchantId } = loginSchema.parse(body);
    
    // Find merchant by email or merchantId
    let merchant;
    if (email) {
      merchant = await getMerchantByEmail(c.env.DB, email);
      if (!merchant) {
        return c.json({ error: 'Not Found', message: 'No account found with this email address' }, 404);
      }
    } else if (merchantId) {
      merchant = await getMerchantById(c.env.DB, merchantId);
      if (!merchant) {
        return c.json({ error: 'Not Found', message: 'Merchant not found' }, 404);
      }
    } else {
      return c.json({ error: 'Bad Request', message: 'Either email or merchantId must be provided' }, 400);
    }
    
    // Allow login for pending and active accounts (new signups are pending by default)
    if (merchant.status === 'suspended') {
      return c.json({ error: 'Forbidden', message: 'Merchant account is suspended' }, 403);
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
