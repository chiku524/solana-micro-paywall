import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { getPurchasesByMerchant, getContentById } from '../lib/db';

const app = new Hono<{ Bindings: Env }>();

// Get payment statistics (protected)
app.get('/stats', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  
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
  
  return c.json({
    totalPayments: allPurchases.length,
    todayPayments: todayPayments.length,
    weekPayments: weekPayments.length,
    monthPayments: monthPayments.length,
    totalRevenueLamports,
    averagePaymentLamports,
  });
});

// Get recent payments (protected)
app.get('/recent-payments', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const limit = parseInt(c.req.query('limit') || '20');
  
  const purchases = await getPurchasesByMerchant(c.env.DB, merchantId, limit, 0);
  
  // Fetch content titles for each purchase
  const recentPayments = await Promise.all(
    purchases.map(async (purchase) => {
      const content = await getContentById(c.env.DB, purchase.contentId);
      return {
        id: purchase.id,
        transactionSignature: purchase.transactionSignature,
        contentTitle: content?.title || 'Unknown',
        amountLamports: purchase.amountLamports,
        payerAddress: purchase.payerAddress,
        confirmedAt: purchase.confirmedAt,
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
