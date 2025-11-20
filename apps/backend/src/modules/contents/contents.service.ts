import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentQueryDto } from './dto/content-query.dto';

@Injectable()
export class ContentsService {
  private readonly logger = new Logger(ContentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create new content
   */
  async create(dto: CreateContentDto) {
    const {
      merchantId,
      slug,
      priceLamports,
      currency = 'SOL',
      durationSecs,
      metadata,
      title,
      description,
      thumbnailUrl,
      category,
      tags,
      visibility = 'private',
      canonicalUrl,
      previewText,
    } = dto;

    // Verify merchant exists
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant not found: ${merchantId}`);
    }

    if (merchant.status !== 'active') {
      // In development, allow pending merchants to create content for easier testing
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(
          `Merchant ${merchantId} has status ${merchant.status}, but allowing content creation in development mode.`,
        );
      } else {
        throw new BadRequestException(`Merchant status is ${merchant.status}, must be active`);
      }
    }

    // Check if content with same slug already exists for this merchant
    const existing = await this.prisma.content.findFirst({
      where: {
        merchantId,
        slug,
      },
    });

    if (existing) {
      throw new ConflictException(`Content with slug '${slug}' already exists for merchant ${merchantId}`);
    }

    const content = await this.prisma.content.create({
      data: {
        merchantId,
        slug,
        priceLamports: BigInt(priceLamports),
        currency,
        durationSecs,
        metadata: metadata || {},
        title,
        description,
        thumbnailUrl,
        category,
        tags: tags || [],
        visibility: visibility || 'private',
        canonicalUrl,
        previewText,
      },
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(`Created content ${content.id} with slug '${slug}' for merchant ${merchantId}`);
    return {
      ...content,
      priceLamports: content.priceLamports.toString(),
    };
  }

  /**
   * Get content by ID
   */
  async findOne(id: string) {
    const cacheKey = `content:${id}`;
    
    // Try cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
            status: true,
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
      throw new NotFoundException(`Content not found: ${id}`);
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
   * Get content by merchant and slug
   */
  async findBySlug(merchantId: string, slug: string) {
    const content = await this.prisma.content.findFirst({
      where: {
        merchantId,
        slug,
      },
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
            status: true,
            payoutAddress: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(`Content not found with slug '${slug}' for merchant ${merchantId}`);
    }

    return {
      ...content,
      priceLamports: content.priceLamports.toString(),
    };
  }

  /**
   * List contents with pagination
   */
  async findAll(query: ContentQueryDto) {
    const { page = 1, limit = 20, merchantId, search, category, visibility } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (merchantId) {
      where.merchantId = merchantId;
    }
    if (category) {
      where.category = category;
    }
    if (visibility) {
      where.visibility = visibility;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Use select to fetch only needed fields for better performance
    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          category: true,
          priceLamports: true,
          currency: true,
          visibility: true,
          viewCount: true,
          purchaseCount: true,
          createdAt: true,
          merchant: {
            select: {
              id: true,
              email: true,
              status: true,
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

    return {
      data: contents.map((c: typeof contents[0]) => ({
        ...c,
        priceLamports: c.priceLamports.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update content
   */
  async update(id: string, dto: UpdateContentDto) {
    const contentData = await this.findOne(id);
    const content = contentData as any; // Type assertion for compatibility

    // Check slug uniqueness if changing slug
    if (dto.slug && dto.slug !== content.slug) {
      const existing = await this.prisma.content.findFirst({
        where: {
          merchantId: content.merchantId,
          slug: dto.slug,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Content with slug '${dto.slug}' already exists for this merchant`);
      }
    }

    const updateData: any = {
      ...dto,
      updatedAt: new Date(),
    };

    if (dto.priceLamports !== undefined) {
      updateData.priceLamports = BigInt(dto.priceLamports);
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
            status: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.cacheService.del(`content:${id}`);
    await this.cacheService.invalidatePattern(`content:list:*`);

    this.logger.log(`Updated content ${id}`);
    return {
      ...updated,
      priceLamports: updated.priceLamports.toString(),
    };
  }

  /**
   * Delete content
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.content.delete({
      where: { id },
    });

    this.logger.log(`Deleted content ${id}`);
    return { message: `Content ${id} deleted successfully` };
  }

  /**
   * Get content statistics
   */
  async getContentStats(id: string) {
    const contentData = await this.findOne(id);
    const content = contentData as any; // Type assertion for compatibility

    const [totalIntents, confirmedIntents, totalRevenue] = await Promise.all([
      this.prisma.paymentIntent.count({
        where: { contentId: id },
      }),
      this.prisma.paymentIntent.count({
        where: {
          contentId: id,
          status: 'confirmed',
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          intent: {
            contentId: id,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      content: {
        id: content.id,
        slug: content.slug,
        priceLamports: content.priceLamports,
        currency: content.currency,
      },
      stats: {
        totalIntents,
        confirmedIntents,
        conversionRate: totalIntents > 0 ? (confirmedIntents / totalIntents) * 100 : 0,
        totalRevenue: totalRevenue._sum.amount?.toString() || '0',
      },
    };
  }
}

