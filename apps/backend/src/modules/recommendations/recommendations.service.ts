import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get recommendations for a wallet address based on purchase history
   */
  async getRecommendationsForWallet(walletAddress: string, limit: number = 6) {
    const cacheKey = `recommendations:wallet:${walletAddress}:${limit}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get user's purchase history
    const purchases = await this.prisma.purchase.findMany({
      where: { walletAddress },
      include: {
        content: {
          select: {
            category: true,
            tags: true,
            merchantId: true,
          },
        },
      },
      take: 50, // Analyze last 50 purchases
    });

    if (purchases.length === 0) {
      // No purchase history, return trending content
      return this.getTrendingContent(limit);
    }

    // Analyze preferences
    const categoryCounts = new Map<string, number>();
    const merchantCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();

    purchases.forEach((purchase: any) => {
      const content = purchase.content;
      
      if (content.category) {
        categoryCounts.set(content.category, (categoryCounts.get(content.category) || 0) + 1);
      }
      
      merchantCounts.set(content.merchantId, (merchantCounts.get(content.merchantId) || 0) + 1);
      
      if (content.tags && Array.isArray(content.tags)) {
        content.tags.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    // Get top categories and merchants
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    const topMerchants = Array.from(merchantCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([merchantId]) => merchantId);

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Get purchased content IDs to exclude
    const purchasedContentIds = purchases.map((p: any) => p.contentId);

    // Find recommended content
    const recommendations = await this.prisma.content.findMany({
      where: {
        id: { notIn: purchasedContentIds },
        visibility: 'public',
        merchant: {
          status: 'active',
        },
        OR: [
          ...(topCategories.length > 0 ? [{ category: { in: topCategories } }] : []),
          ...(topMerchants.length > 0 ? [{ merchantId: { in: topMerchants } }] : []),
          ...(topTags.length > 0 ? [{ tags: { hasSome: topTags } }] : []),
        ],
      },
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            paymentIntents: true,
          },
        },
      },
      orderBy: [
        { purchaseCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    const result = recommendations.map((content) => ({
      ...content,
      priceLamports: content.priceLamports.toString(),
      purchaseCount: content._count.paymentIntents,
    }));

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Get recommendations based on a specific content item
   * Combines collaborative filtering with content-based filtering
   */
  async getRecommendationsForContent(contentId: string, limit: number = 6) {
    const cacheKey = `recommendations:content:${contentId}:${limit}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: {
        category: true,
        tags: true,
        merchantId: true,
      },
    });

    if (!content) {
      return this.getTrendingContent(limit);
    }

    // Try collaborative filtering first
    const collaborative = await this.getCollaborativeRecommendations(contentId, limit * 2);
    
    // If we have good collaborative results, use them
    if (collaborative.length >= limit) {
      const result = collaborative.slice(0, limit);
      await this.cacheService.set(cacheKey, result, 600);
      return result;
    }

    // Fall back to content-based filtering
    const recommendations = await this.prisma.content.findMany({
      where: {
        id: { not: contentId },
        visibility: 'public',
        merchant: {
          status: 'active',
        },
        OR: [
          ...(content.category ? [{ category: content.category }] : []),
          { merchantId: content.merchantId },
          ...(content.tags && content.tags.length > 0
            ? [{ tags: { hasSome: content.tags } }]
            : []),
        ],
      },
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            paymentIntents: true,
          },
        },
      },
      orderBy: [
        { purchaseCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Merge collaborative and content-based results
    const collaborativeIds = new Set(collaborative.map((c: any) => c.id));
    const contentBased = recommendations.filter((c) => !collaborativeIds.has(c.id));
    const merged = [...collaborative, ...contentBased].slice(0, limit);

    const result = merged.map((c: any) => ({
      ...c,
      priceLamports: c.priceLamports?.toString() || c.priceLamports,
      purchaseCount: c._count?.paymentIntents || c.purchaseCount || 0,
    }));

    // Cache for 10 minutes
    await this.cacheService.set(cacheKey, result, 600);
    return result;
  }

  /**
   * Get recommendations using collaborative filtering (users who bought X also bought Y)
   */
  async getCollaborativeRecommendations(contentId: string, limit: number = 6) {
    const cacheKey = `recommendations:collaborative:${contentId}:${limit}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Find all users who purchased this content
    const purchasers = await this.prisma.purchase.findMany({
      where: { contentId },
      select: { walletAddress: true },
      distinct: ['walletAddress'],
    });

    if (purchasers.length === 0) {
      // No purchasers yet, fall back to similar content
      return this.getRecommendationsForContent(contentId, limit);
    }

    const purchaserWallets = purchasers.map((p) => p.walletAddress);

    // Find other content purchased by the same users
    const relatedPurchases = await this.prisma.purchase.findMany({
      where: {
        walletAddress: { in: purchaserWallets },
        contentId: { not: contentId },
        content: {
          visibility: 'public',
          merchant: { status: 'active' },
        },
      },
      include: {
        content: {
          include: {
            merchant: {
              select: {
                id: true,
                email: true,
              },
            },
            _count: {
              select: {
                paymentIntents: true,
              },
            },
          },
        },
      },
    });

    // Count how many users bought each related content
    const contentScores = new Map<string, { content: any; score: number }>();

    relatedPurchases.forEach((purchase) => {
      const contentId = purchase.contentId;
      const existing = contentScores.get(contentId);
      
      if (existing) {
        existing.score += 1;
      } else {
        contentScores.set(contentId, {
          content: purchase.content,
          score: 1,
        });
      }
    });

    // Sort by score and take top results
    const sorted = Array.from(contentScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const result = sorted.map((item) => ({
      ...item.content,
      priceLamports: item.content.priceLamports.toString(),
      purchaseCount: item.content._count.paymentIntents,
      collaborativeScore: item.score, // Number of users who bought both
    }));

    // Cache for 15 minutes
    await this.cacheService.set(cacheKey, result, 900);
    return result;
  }

  /**
   * Get trending content as fallback
   */
  private async getTrendingContent(limit: number) {
    const cacheKey = `recommendations:trending:${limit}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const trending = await this.prisma.content.findMany({
      where: {
        visibility: 'public',
        merchant: {
          status: 'active',
        },
      },
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            paymentIntents: true,
          },
        },
      },
      orderBy: [
        { purchaseCount: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    const result = trending.map((content) => ({
      ...content,
      priceLamports: content.priceLamports.toString(),
      purchaseCount: content._count.paymentIntents,
    }));

    // Cache for 10 minutes
    await this.cacheService.set(cacheKey, result, 600);
    return result;
  }
}

