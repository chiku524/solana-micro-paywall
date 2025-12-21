import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { getMerchantById, createMerchant, updateMerchant, getMerchantByEmail } from '../lib/db';
import { z } from 'zod';
import { checkRateLimit, getRateLimitKey } from '../lib/rate-limit';

const app = new Hono<{ Bindings: Env }>();

const createMerchantSchema = z.object({
  email: z.string().email(),
  payoutAddress: z.string().optional(),
});

const updateMerchantSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  payoutAddress: z.string().optional(),
  webhookSecret: z.string().optional(),
  twitterUrl: z.string().url().optional(),
  telegramUrl: z.string().url().optional(),
  discordUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
});

// Create merchant (public)
app.post('/', async (c) => {
  try {
    // Rate limiting
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = getRateLimitKey(ip, 'create-merchant');
    const rateLimit = await checkRateLimit(c.env.CACHE, rateLimitKey, { limit: 5, windowSeconds: 3600 });
    
    if (!rateLimit.allowed) {
      return c.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded' },
        429,
        { 'Retry-After': String(rateLimit.resetAt - Math.floor(Date.now() / 1000)) }
      );
    }
    
    const body = await c.req.json();
    const { email, payoutAddress } = createMerchantSchema.parse(body);
    
    // Check if email already exists
    const existing = await getMerchantByEmail(c.env.DB, email);
    if (existing) {
      return c.json({ error: 'Conflict', message: 'Merchant with this email already exists' }, 409);
    }
    
    const merchantId = crypto.randomUUID();
    const merchant = await createMerchant(c.env.DB, {
      id: merchantId,
      email,
      payoutAddress,
    });
    
    return c.json({
      id: merchant.id,
      email: merchant.email,
      displayName: merchant.displayName,
      payoutAddress: merchant.payoutAddress,
      status: merchant.status,
      createdAt: merchant.createdAt,
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// Get current merchant (protected)
app.get('/me', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const merchant = await getMerchantById(c.env.DB, merchantId);
  
  if (!merchant) {
    return c.json({ error: 'Not Found', message: 'Merchant not found' }, 404);
  }
  
  return c.json({
    id: merchant.id,
    email: merchant.email,
    displayName: merchant.displayName,
    bio: merchant.bio,
    avatarUrl: merchant.avatarUrl,
    payoutAddress: merchant.payoutAddress,
    webhookSecret: merchant.webhookSecret,
    twitterUrl: merchant.twitterUrl,
    telegramUrl: merchant.telegramUrl,
    discordUrl: merchant.discordUrl,
    githubUrl: merchant.githubUrl,
    status: merchant.status,
    createdAt: merchant.createdAt,
    updatedAt: merchant.updatedAt,
  });
});

// Get merchant by ID (public)
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const merchant = await getMerchantById(c.env.DB, id);
  
  if (!merchant) {
    return c.json({ error: 'Not Found', message: 'Merchant not found' }, 404);
  }
  
  return c.json({
    id: merchant.id,
    displayName: merchant.displayName,
    bio: merchant.bio,
    avatarUrl: merchant.avatarUrl,
    twitterUrl: merchant.twitterUrl,
    telegramUrl: merchant.telegramUrl,
    discordUrl: merchant.discordUrl,
    githubUrl: merchant.githubUrl,
    createdAt: merchant.createdAt,
  });
});

// Update merchant (protected)
app.put('/me', authMiddleware, async (c) => {
  try {
    const merchantId = c.get('merchantId');
    const body = await c.req.json();
    const updates = updateMerchantSchema.parse(body);
    
    const merchant = await updateMerchant(c.env.DB, merchantId, updates);
    
    return c.json({
      id: merchant.id,
      email: merchant.email,
      displayName: merchant.displayName,
      bio: merchant.bio,
      avatarUrl: merchant.avatarUrl,
      payoutAddress: merchant.payoutAddress,
      webhookSecret: merchant.webhookSecret,
      twitterUrl: merchant.twitterUrl,
      telegramUrl: merchant.telegramUrl,
      discordUrl: merchant.discordUrl,
      githubUrl: merchant.githubUrl,
      status: merchant.status,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

export default app;
