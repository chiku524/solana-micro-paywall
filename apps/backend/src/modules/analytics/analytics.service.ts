import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';

export interface AnalyticsEvent {
  type: string;
  merchantId?: string;
  contentId?: string;
  walletAddress?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Track an analytics event
   */
  async trackEvent(event: AnalyticsEvent) {
    try {
      // Store in DashboardEvent for now (can be extended with dedicated analytics table)
      if (event.merchantId) {
        await this.prisma.dashboardEvent.create({
          data: {
            merchantId: event.merchantId,
            eventType: event.type,
            metadata: event.metadata || {},
          },
        });
      }

      // Invalidate relevant caches
      if (event.merchantId) {
        await this.cacheService.del(`merchant:${event.merchantId}:stats`);
      }
      if (event.contentId) {
        await this.cacheService.del(`content:${event.contentId}:stats`);
      }
    } catch (error) {
      this.logger.error('Failed to track analytics event', error);
    }
  }

  /**
   * Get conversion rate for a merchant
   */
  async getConversionRate(merchantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const cacheKey = `analytics:conversion:${merchantId}:${days}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [paymentIntents, confirmedPayments] = await Promise.all([
      this.prisma.paymentIntent.count({
        where: {
          merchantId,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.payment.count({
        where: {
          intent: {
            merchantId,
          },
          confirmedAt: { gte: startDate },
        },
      }),
    ]);

    const conversionRate = paymentIntents > 0 ? (confirmedPayments / paymentIntents) * 100 : 0;

    const result = {
      conversionRate: Number(conversionRate.toFixed(2)),
      totalIntents: paymentIntents,
      confirmedPayments,
      period: days,
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Get top content by sales
   */
  async getTopContent(merchantId?: string, limit: number = 10) {
    const cacheKey = `analytics:top-content:${merchantId || 'all'}:${limit}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {
      visibility: 'public',
      merchant: {
        status: 'active',
      },
    };

    if (merchantId) {
      where.merchantId = merchantId;
    }

    const topContent = await this.prisma.content.findMany({
      where,
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            purchases: true,
          },
        },
      },
      orderBy: {
        purchaseCount: 'desc',
      },
      take: limit,
    });

    const result = topContent.map((content) => ({
      id: content.id,
      title: content.title || content.slug,
      merchant: content.merchant,
      purchaseCount: content._count.purchases,
      viewCount: content.viewCount,
      priceLamports: content.priceLamports.toString(),
      currency: content.currency,
    }));

    // Cache for 10 minutes
    await this.cacheService.set(cacheKey, result, 600);
    return result;
  }

  /**
   * Get merchant performance metrics
   */
  async getMerchantPerformance(merchantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const cacheKey = `analytics:performance:${merchantId}:${days}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [
      totalRevenue,
      totalSales,
      totalContent,
      totalFollowers,
      conversionRate,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          intent: {
            merchantId,
          },
          confirmedAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      this.prisma.purchase.count({
        where: {
          merchantId,
          purchasedAt: { gte: startDate },
        },
      }),
      this.prisma.content.count({
        where: {
          merchantId,
        },
      }),
      this.prisma.merchantFollow.count({
        where: {
          merchantId,
        },
      }),
      this.getConversionRate(merchantId, days),
    ]);

    const result = {
      period: days,
      totalRevenue: totalRevenue._sum.amount?.toString() || '0',
      totalSales,
      totalContent,
      totalFollowers,
      conversionRate: conversionRate.conversionRate,
      avgRevenuePerSale:
        totalSales > 0
          ? (Number(totalRevenue._sum.amount || 0) / totalSales / 1e9).toFixed(4)
          : '0',
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Track content view
   */
  async trackContentView(contentId: string) {
    try {
      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          viewCount: { increment: 1 },
        },
      });

      await this.trackEvent({
        type: 'content.viewed',
        contentId,
      });
    } catch (error) {
      this.logger.error('Failed to track content view', error);
    }
  }

  /**
   * Track purchase
   */
  async trackPurchase(purchase: any) {
    await this.trackEvent({
      type: 'purchase.completed',
      merchantId: purchase.merchantId,
      contentId: purchase.contentId,
      walletAddress: purchase.walletAddress,
      metadata: {
        amount: purchase.payment?.amount?.toString(),
        currency: purchase.payment?.currency,
      },
    });
  }
}

