import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import {
  getPurchaseById,
  getPurchaseByAccessToken,
  getPurchaseByTransactionSignature,
  getPurchasesByWallet,
  getPurchasesByContent,
  getPurchasesByMerchant,
  createPurchase,
  getPaymentIntentById,
  getContentById,
  incrementContentPurchaseCount,
} from '../lib/db';
import { generateAccessToken } from '../lib/access-token';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

const createPurchaseSchema = z.object({
  paymentIntentId: z.string().min(1),
  transactionSignature: z.string().min(1),
  payerAddress: z.string().min(1),
});

// Create purchase after payment verification (public)
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { paymentIntentId, transactionSignature, payerAddress } = createPurchaseSchema.parse(body);
    
    // Check if purchase already exists
    const existingPurchase = await getPurchaseByTransactionSignature(c.env.DB, transactionSignature);
    if (existingPurchase) {
      // Return existing purchase
      const accessToken = await generateAccessToken(
        c.env.JWT_SECRET,
        existingPurchase.merchantId,
        existingPurchase.contentId,
        existingPurchase.payerAddress,
        existingPurchase.id,
        undefined // Use default expiration
      );
      
      return c.json({
        purchase: existingPurchase,
        accessToken,
      });
    }
    
    // Get payment intent
    const paymentIntent = await getPaymentIntentById(c.env.DB, paymentIntentId);
    if (!paymentIntent) {
      return c.json({ error: 'Not Found', message: 'Payment intent not found' }, 404);
    }
    
    if (paymentIntent.status !== 'confirmed') {
      return c.json({ error: 'Bad Request', message: `Payment intent is ${paymentIntent.status}` }, 400);
    }
    
    // Get content to determine expiration
    const content = await getContentById(c.env.DB, paymentIntent.contentId);
    if (!content) {
      return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
    }
    
    // Calculate expiration
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = content.durationSeconds 
      ? now + content.durationSeconds
      : undefined;
    
    // Create purchase
    const purchaseId = crypto.randomUUID();
    const accessToken = await generateAccessToken(
      c.env.JWT_SECRET,
      paymentIntent.merchantId,
      paymentIntent.contentId,
      payerAddress,
      purchaseId,
      content.durationSeconds
    );
    
    const chain = (paymentIntent as { chain?: string }).chain ?? 'solana';
    const purchase = await createPurchase(c.env.DB, {
      id: purchaseId,
      paymentIntentId: paymentIntent.id,
      merchantId: paymentIntent.merchantId,
      contentId: paymentIntent.contentId,
      payerAddress,
      amountLamports: paymentIntent.amountLamports,
      currency: paymentIntent.currency,
      transactionSignature,
      accessToken,
      expiresAt,
      chain,
    });
    
    // Increment content purchase count
    await incrementContentPurchaseCount(c.env.DB, content.id);
    
    return c.json({
      purchase,
      accessToken,
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// Get purchase by access token (public)
app.get('/access/:token', async (c) => {
  const token = c.req.param('token');
  const purchase = await getPurchaseByAccessToken(c.env.DB, token);
  
  if (!purchase) {
    return c.json({ error: 'Not Found', message: 'Purchase not found' }, 404);
  }
  
  // Check if expired
  const now = Math.floor(Date.now() / 1000);
  if (purchase.expiresAt && now > purchase.expiresAt) {
    return c.json({ error: 'Forbidden', message: 'Access token expired' }, 403);
  }
  
  return c.json(purchase);
});

// Check access for wallet and content (public)
app.get('/check-access', async (c) => {
  const walletAddress = c.req.query('walletAddress');
  const contentId = c.req.query('contentId');
  
  if (!walletAddress || !contentId) {
    return c.json({ error: 'Bad Request', message: 'walletAddress and contentId are required' }, 400);
  }
  
  // Get all purchases for this wallet and content
  const purchases = await getPurchasesByWallet(c.env.DB, walletAddress, 100, 0);
  const validPurchase = purchases.find(p => {
    if (p.contentId !== contentId) return false;
    if (p.expiresAt && Math.floor(Date.now() / 1000) > p.expiresAt) return false;
    return true;
  });
  
  if (!validPurchase) {
    return c.json({ hasAccess: false });
  }
  
  return c.json({
    hasAccess: true,
    purchase: validPurchase,
    expiresAt: validPurchase.expiresAt,
  });
});

// List purchases by wallet (public)
app.get('/wallet/:walletAddress', async (c) => {
  const walletAddress = c.req.param('walletAddress');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');
  
  const purchases = await getPurchasesByWallet(c.env.DB, walletAddress, limit, offset);
  
  return c.json({ purchases });
});

// List merchant's purchases (protected)
app.get('/merchant', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');
  
  const purchases = await getPurchasesByMerchant(c.env.DB, merchantId, limit, offset);
  
  return c.json({ purchases });
});

// Get purchase by ID (protected, merchant only)
app.get('/:id', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const id = c.req.param('id');
  
  const purchase = await getPurchaseById(c.env.DB, id);
  if (!purchase) {
    return c.json({ error: 'Not Found', message: 'Purchase not found' }, 404);
  }
  
  if (purchase.merchantId !== merchantId) {
    return c.json({ error: 'Forbidden', message: 'Purchase does not belong to merchant' }, 403);
  }
  
  return c.json(purchase);
});

export default app;
