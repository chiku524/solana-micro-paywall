import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';
import { DiscoverQueryDto } from './dto/discover-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DiscoverService {
  private readonly logger = new Logger(DiscoverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Discover public contents with filtering and search
   */
  async discoverContents(query: DiscoverQueryDto) {
    const {
      category,
      tags,
      search,
      minPrice,
      maxPrice,
      currency,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    // Generate cache key from query parameters
    const cacheKey = `discover:${JSON.stringify({ category, tags, search, minPrice, maxPrice, currency, sort, page, limit })}`;
    
    // Try cache first (5 minutes TTL for discovery queries)
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build where clause
    const where: Prisma.ContentWhereInput = {
      visibility: 'public',
      merchant: {
        status: 'active',
      },
    };

    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { previewText: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined || currency) {
      where.priceLamports = {};
      if (minPrice !== undefined) {
        where.priceLamports.gte = BigInt(minPrice);
      }
      if (maxPrice !== undefined) {
        where.priceLamports.lte = BigInt(maxPrice);
      }
      if (currency) {
        where.currency = currency;
      }
    }

    // Build orderBy
    let orderBy: Prisma.ContentOrderByWithRelationInput = {};
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        orderBy = { purchaseCount: 'desc' };
        break;
      case 'price_asc':
        orderBy = { priceLamports: 'asc' };
        break;
      case 'price_desc':
        orderBy = { priceLamports: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          merchant: {
            select: {
              id: true,
              email: true,
              payoutAddress: true,
            },
          },
          _count: {
            select: {
              paymentIntents: true,
            },
          },
        },
      }),
      this.prisma.content.count({ where }),
    ]);

    const result = {
      contents: contents.map((c) => ({
        ...c,
        priceLamports: c.priceLamports.toString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Get content details (public only)
   */
  async getContentDetails(id: string) {
    const cacheKey = `discover:content:${id}`;
    
    // Try cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const content = await this.prisma.content.findFirst({
      where: {
        id,
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
            payoutAddress: true,
          },
        },
        _count: {
          select: {
            paymentIntents: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(`Content not found or not public: ${id}`);
    }

    const result = {
      ...content,
      priceLamports: content.priceLamports.toString(),
    };

    // Cache for 10 minutes
    await this.cacheService.set(cacheKey, result, 600);
    return result;
  }

  /**
   * Get public contents for a specific merchant
   */
  async getMerchantContents(merchantId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ContentWhereInput = {
      merchantId,
      visibility: 'public',
      merchant: {
        status: 'active',
      },
    };

    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              paymentIntents: true,
            },
          },
        },
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      contents: contents.map((c) => ({
        ...c,
        priceLamports: c.priceLamports.toString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all categories with counts
   */
  async getCategories() {
    const cacheKey = 'discover:categories';
    
    // Try cache first (10 minutes TTL - categories don't change often)
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const contents = await this.prisma.content.findMany({
      where: {
        visibility: 'public',
        category: { not: null },
        merchant: {
          status: 'active',
        },
      },
      select: {
        category: true,
      },
    });

    const categoryCounts = contents.reduce((acc, content) => {
      if (content.category) {
        acc[content.category] = (acc[content.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const result = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    }));

    // Cache for 10 minutes
    await this.cacheService.set(cacheKey, result, 600);
    return result;
  }

  /**
   * Get trending contents
   */
  async getTrending(limit: number = 10) {
    // Ensure limit is a number
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit || 10;
    
    const cacheKey = `discover:trending:${limitNum}`;
    
    // Try cache first (5 minutes TTL - trending changes more frequently)
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const contents = await this.prisma.content.findMany({
      where: {
        visibility: 'public',
        merchant: {
          status: 'active',
        },
      },
      orderBy: [
        { purchaseCount: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limitNum,
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
    });

    const result = contents.map((c) => ({
      ...c,
      priceLamports: c.priceLamports.toString(),
    }));

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }
}

