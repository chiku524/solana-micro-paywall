import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { getPurchasesByMerchant, getContentById, insertAnalyticsEvent, countAnalyticsEventsByMerchant, countAnalyticsEventsByContent } from '../lib/db';
import { getCache, setCache, cacheKeys } from '../lib/cache';
import { checkRateLimit, getRateLimitKey } from '../lib/rate-limit';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

const trackBodySchema = z.object({
  eventType: z.enum(['content_impression', 'pay_click', 'purchase_verified']),
  contentId: z.string().min(1).optional(),
  meta: z.any().optional(),
});

app.post('/events', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const rl = await checkRateLimit(c.env.CACHE, getRateLimitKey(ip, 'analytics-events'), {
      limit: 120,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return c.json({ error: 'Too Many Requests', message: 'Rate limit exceeded' }, 429);
    }

    const body = await c.req.json();
    const parsed = trackBodySchema.parse(body);
    let merchantId: string | null = null;
    if (parsed.contentId) {
      const content = await getContentById(c.env.DB, parsed.contentId);
      merchantId = content?.merchantId ?? null;
    }
    await insertAnalyticsEvent(c.env.DB, {
      id: crypto.randomUUID(),
      contentId: parsed.contentId ?? null,
      merchantId,
      eventType: parsed.eventType,
      meta: parsed.meta ? JSON.stringify(parsed.meta) : null,
    });
    return c.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

app.get('/funnel', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const now = Math.floor(Date.now() / 1000);
  const since = now - 30 * 86400;
  const totals = await countAnalyticsEventsByMerchant(c.env.DB, merchantId, since);
  const byContent = await countAnalyticsEventsByContent(c.env.DB, merchantId, since);
  return c.json({ since, totals, byContent });
});

// Get payment statistics (protected)
app.get('/stats', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  
  // Try cache first (cache for 1 minute)
  const cacheKey = cacheKeys.stats(merchantId);
  const cached = await getCache(c.env.CACHE, cacheKey);
  if (cached) {
    return c.json(cached);
  }
  
  // Get all purchases for merchant
  const allPurchases = await getPurchasesByMerchant(c.env.DB, merchantId, 10000, 0);
  
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 86400;
  const oneWeekAgo = now - 604800;
  const oneMonthAgo = now - 2592000;
  
  const todayPayments = allPurchases.filter(p => p.confirmedAt >= oneDayAgo);
  const weekPayments = allPurchases.filter(p => p.confirmedAt >= oneWeekAgo);
  const monthPayments = allPurchases.filter(p => p.confirmedAt >= oneMonthAgo);
  
  const totalRevenueLamports = allPurchases.reduce((sum, p) => sum + p.amountLamports, 0);
  const averagePaymentLamports = allPurchases.length > 0 
    ? Math.floor(totalRevenueLamports / allPurchases.length)
    : 0;
  
  const stats = {
    totalPayments: allPurchases.length,
    todayPayments: todayPayments.length,
    weekPayments: weekPayments.length,
    monthPayments: monthPayments.length,
    totalRevenueLamports,
    averagePaymentLamports,
  };
  
  // Cache for 1 minute
  await setCache(c.env.CACHE, cacheKey, stats, { ttl: 60 });
  
  return c.json(stats);
});

// Get recent payments (protected)
app.get('/recent-payments', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const limit = parseInt(c.req.query('limit') || '20');
  
  const purchases = await getPurchasesByMerchant(c.env.DB, merchantId, limit, 0);
  
  // Fetch content titles for each purchase (optimize with caching)
  const recentPayments = await Promise.all(
    purchases.map(async (purchase) => {
      // Try cache first
      const contentCacheKey = cacheKeys.content(purchase.contentId);
      let content = await getCache(c.env.CACHE, contentCacheKey);
      
      if (!content) {
        content = await getContentById(c.env.DB, purchase.contentId);
        if (content) {
          await setCache(c.env.CACHE, contentCacheKey, content, { ttl: 600 });
        }
      }
      
      return {
        id: purchase.id,
        transactionSignature: purchase.transactionSignature,
        contentTitle: content?.title || 'Unknown',
        amountLamports: purchase.amountLamports,
        payerAddress: purchase.payerAddress,
        confirmedAt: purchase.confirmedAt,
        chain: purchase.chain ?? 'solana',
      };
    })
  );
  
  return c.json({ payments: recentPayments });
});

// Get analytics with date range (protected)
app.get('/payments', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  
  // Get all purchases for merchant
  let purchases = await getPurchasesByMerchant(c.env.DB, merchantId, 10000, 0);
  
  // Filter by date range if provided
  if (startDate || endDate) {
    const start = startDate ? parseInt(startDate) : 0;
    const end = endDate ? parseInt(endDate) : Math.floor(Date.now() / 1000);
    
    purchases = purchases.filter(p => p.confirmedAt >= start && p.confirmedAt <= end);
  }
  
  // Calculate growth metrics
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 86400;
  const oneWeekAgo = now - 604800;
  const oneMonthAgo = now - 2592000;
  
  const todayPayments = purchases.filter(p => p.confirmedAt >= oneDayAgo);
  const weekPayments = purchases.filter(p => p.confirmedAt >= oneWeekAgo);
  const monthPayments = purchases.filter(p => p.confirmedAt >= oneMonthAgo);
  const previousWeekPayments = purchases.filter(
    p => p.confirmedAt >= oneWeekAgo - 604800 && p.confirmedAt < oneWeekAgo
  );
  
  const weekGrowth = previousWeekPayments.length > 0
    ? ((weekPayments.length - previousWeekPayments.length) / previousWeekPayments.length) * 100
    : 0;
  
  const totalRevenueLamports = purchases.reduce((sum, p) => sum + p.amountLamports, 0);
  const averagePaymentLamports = purchases.length > 0
    ? Math.floor(totalRevenueLamports / purchases.length)
    : 0;
  
  // Fetch content titles
  const purchasesWithContent = await Promise.all(
    purchases.map(async (purchase) => {
      const content = await getContentById(c.env.DB, purchase.contentId);
      return {
        ...purchase,
        contentTitle: content?.title || 'Unknown',
      };
    })
  );
  
  return c.json({
    purchases: purchasesWithContent,
    stats: {
      totalPayments: purchases.length,
      todayPayments: todayPayments.length,
      weekPayments: weekPayments.length,
      monthPayments: monthPayments.length,
      weekGrowth,
      totalRevenueLamports,
      averagePaymentLamports,
    },
  });
});

// Export payments as CSV (protected)
app.get('/export', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  
  let purchases = await getPurchasesByMerchant(c.env.DB, merchantId, 10000, 0);
  
  if (startDate || endDate) {
    const start = startDate ? parseInt(startDate) : 0;
    const end = endDate ? parseInt(endDate) : Math.floor(Date.now() / 1000);
    purchases = purchases.filter(p => p.confirmedAt >= start && p.confirmedAt <= end);
  }
  
  // Fetch content titles
  const purchasesWithContent = await Promise.all(
    purchases.map(async (purchase) => {
      const content = await getContentById(c.env.DB, purchase.contentId);
      return {
        ...purchase,
        contentTitle: content?.title || 'Unknown',
      };
    })
  );
  
  // Generate CSV
  const headers = ['Date', 'Transaction Signature', 'Content', 'Amount (SOL)', 'Payer Address'];
  const rows = purchasesWithContent.map(p => [
    new Date(p.confirmedAt * 1000).toISOString(),
    p.transactionSignature,
    p.contentTitle,
    (p.amountLamports / 1_000_000_000).toString(),
    p.payerAddress,
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  return c.text(csv, 200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="payments-${Date.now()}.csv"`,
  });
});

export default app;
