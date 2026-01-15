import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { getMerchantById, createMerchant, updateMerchant, getMerchantByEmail, setEmailVerificationToken } from '../lib/db';
import { z } from 'zod';
import { checkRateLimit, getRateLimitKey } from '../lib/rate-limit';
import { hashPassword, validatePasswordStrength } from '../lib/password';
import { generateSecureToken } from '../lib/security';

const app = new Hono<{ Bindings: Env }>();

const createMerchantSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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
    // Validate bindings are available
    if (!c.env.DB) {
      return c.json({ error: 'Configuration Error', message: 'Database binding not configured' }, 500);
    }
    if (!c.env.CACHE) {
      return c.json({ error: 'Configuration Error', message: 'KV cache binding not configured' }, 500);
    }
    
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
    const { email, password, payoutAddress } = createMerchantSchema.parse(body);
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return c.json({ error: 'Bad Request', message: passwordValidation.error }, 400);
    }
    
    // Check if email already exists
    const existing = await getMerchantByEmail(c.env.DB, email);
    if (existing) {
      return c.json({ error: 'Conflict', message: 'Merchant with this email already exists' }, 409);
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    const merchantId = crypto.randomUUID();
    const merchant = await createMerchant(c.env.DB, {
      id: merchantId,
      email,
      passwordHash,
      payoutAddress,
    });
    
    // Generate email verification token
    const verificationToken = generateSecureToken(32);
    await setEmailVerificationToken(c.env.DB, merchantId, verificationToken);
    
    // Send verification email
    const verificationUrl = `${c.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const { sendEmail, generateEmailVerificationEmail } = await import('../lib/email');
    const { subject, html, text } = generateEmailVerificationEmail(verificationUrl);
    
    try {
      await sendEmail(c.env, {
        to: email,
        subject,
        html,
        text,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail signup if email fails
    }
    
    return c.json({
      id: merchant.id,
      email: merchant.email,
      displayName: merchant.displayName,
      payoutAddress: merchant.payoutAddress,
      status: merchant.status,
      createdAt: merchant.createdAt,
      emailVerified: false,
      message: 'Account created. Please check your email to verify your account.',
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    console.error('Error creating merchant:', error);
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
  
  // Exclude passwordHash from response
  const { passwordHash, ...merchantWithoutPassword } = merchant;
  
  return c.json({
    id: merchantWithoutPassword.id,
    email: merchantWithoutPassword.email,
    displayName: merchantWithoutPassword.displayName,
    bio: merchantWithoutPassword.bio,
    avatarUrl: merchantWithoutPassword.avatarUrl,
    payoutAddress: merchantWithoutPassword.payoutAddress,
    webhookSecret: merchantWithoutPassword.webhookSecret,
    twitterUrl: merchantWithoutPassword.twitterUrl,
    telegramUrl: merchantWithoutPassword.telegramUrl,
    discordUrl: merchantWithoutPassword.discordUrl,
    githubUrl: merchantWithoutPassword.githubUrl,
    status: merchantWithoutPassword.status,
    createdAt: merchantWithoutPassword.createdAt,
    updatedAt: merchantWithoutPassword.updatedAt,
  });
});

// Get merchant by ID (public)
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const merchant = await getMerchantById(c.env.DB, id);
  
  if (!merchant) {
    return c.json({ error: 'Not Found', message: 'Merchant not found' }, 404);
  }
  
  // Exclude passwordHash and sensitive fields from public endpoint
  const { passwordHash, email, webhookSecret, payoutAddress, ...publicMerchant } = merchant;
  
  return c.json({
    id: publicMerchant.id,
    displayName: publicMerchant.displayName,
    bio: publicMerchant.bio,
    avatarUrl: publicMerchant.avatarUrl,
    twitterUrl: publicMerchant.twitterUrl,
    telegramUrl: publicMerchant.telegramUrl,
    discordUrl: publicMerchant.discordUrl,
    githubUrl: publicMerchant.githubUrl,
    createdAt: publicMerchant.createdAt,
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
