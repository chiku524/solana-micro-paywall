import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';
import { SolanaService } from '../solana/solana.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { MerchantQueryDto } from './dto/merchant-query.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class MerchantsService {
  private readonly logger = new Logger(MerchantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly solana: SolanaService,
  ) {}

  /**
   * Create a new merchant
   */
  async create(dto: CreateMerchantDto) {
    const { email, payoutAddress, webhookSecret } = dto;

    // Check if merchant already exists
    const existing = await this.prisma.merchant.findUnique({
      where: { email },
    });

    if (existing) {
      // Return existing merchant instead of throwing error
      // This allows the frontend to automatically log in existing merchants
      this.logger.log(`Merchant with email ${email} already exists, returning existing merchant ${existing.id}`);
      
      // Auto-activate pending merchants for development/testing
      if (existing.status === 'pending') {
        const updated = await this.prisma.merchant.update({
          where: { id: existing.id },
          data: { status: 'active' },
        });
        // Clear cache
        await this.cacheService.del(`merchant:${existing.id}`);
        await this.cacheService.del(`merchant:email:${email}`);
        this.logger.log(`Auto-activated merchant ${existing.id} from pending to active`);
        return updated;
      }
      
      return existing;
    }

    // Validate payout address if provided
    if (payoutAddress && !this.solana.isValidAddress(payoutAddress)) {
      throw new BadRequestException(`Invalid Solana address: ${payoutAddress}`);
    }

    // Generate webhook secret if not provided
    const finalWebhookSecret = webhookSecret || randomBytes(32).toString('hex');

    const merchant = await this.prisma.merchant.create({
      data: {
        email,
        payoutAddress,
        webhookSecret: finalWebhookSecret,
        status: 'active', // Auto-activate for development
        configJson: {},
      },
    });

    this.logger.log(`Created merchant ${merchant.id} with email ${email}`);
    return merchant;
  }

  /**
   * Get merchant by ID
   */
  async findOne(id: string) {
    const cacheKey = `merchant:${id}`;
    
    // Try cache first (5 minutes TTL)
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contents: true,
            paymentIntents: true,
            accessTokens: true,
          },
        },
      },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant not found: ${id}`);
    }

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, merchant, 300);
    return merchant;
  }

  /**
   * Get merchant by email
   */
  async findByEmail(email: string) {
    const cacheKey = `merchant:email:${email}`;
    
    // Try cache first (5 minutes TTL)
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const merchant = await this.prisma.merchant.findUnique({
      where: { email },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant not found with email: ${email}`);
    }

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, merchant, 300);
    // Also cache by ID
    await this.cacheService.set(`merchant:${merchant.id}`, merchant, 300);
    return merchant;
  }

  /**
   * List merchants with pagination
   */
  async findAll(query: MerchantQueryDto) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.email = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [merchants, total] = await Promise.all([
      this.prisma.merchant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              contents: true,
              paymentIntents: true,
              accessTokens: true,
            },
          },
        },
      }),
      this.prisma.merchant.count({ where }),
    ]);

    return {
      data: merchants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update merchant
   */
  async update(id: string, dto: UpdateMerchantDto) {
    const merchantData = await this.findOne(id);
    const merchant = merchantData as any; // Type assertion for cached data

    // Validate payout address if provided
    if (dto.payoutAddress && !this.solana.isValidAddress(dto.payoutAddress)) {
      throw new BadRequestException(`Invalid Solana address: ${dto.payoutAddress}`);
    }

    const updated = await this.prisma.merchant.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    await this.cacheService.del(`merchant:${id}`);
    if (merchant?.email) {
      await this.cacheService.del(`merchant:email:${merchant.email}`);
    }

    this.logger.log(`Updated merchant ${id}`);
    return updated;
  }

  /**
   * Delete merchant (soft delete by setting status to suspended)
   */
  async remove(id: string) {
    await this.findOne(id);

    const deleted = await this.prisma.merchant.update({
      where: { id },
      data: {
        status: 'suspended',
      },
    });

    this.logger.log(`Suspended merchant ${id}`);
    return deleted;
  }

  /**
   * Get merchant dashboard statistics
   */
  async getDashboardStats(merchantId: string) {
    const merchantData = await this.findOne(merchantId);
    const merchant = merchantData as any; // Type assertion for cached data

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get payment statistics
    const [totalPayments, todayPayments, weekPayments, monthPayments] = await Promise.all([
      this.prisma.payment.count({
        where: {
          intent: {
            merchantId,
          },
        },
      }),
      this.prisma.payment.count({
        where: {
          intent: {
            merchantId,
          },
          confirmedAt: {
            gte: startOfDay,
          },
        },
      }),
      this.prisma.payment.count({
        where: {
          intent: {
            merchantId,
          },
          confirmedAt: {
            gte: startOfWeek,
          },
        },
      }),
      this.prisma.payment.count({
        where: {
          intent: {
            merchantId,
          },
          confirmedAt: {
            gte: startOfMonth,
          },
        },
      }),
    ]);

    // Get revenue statistics (sum of amounts)
    const revenueData = await this.prisma.payment.aggregate({
      where: {
        intent: {
          merchantId,
        },
      },
      _sum: {
        amount: true,
      },
      _avg: {
        amount: true,
      },
    });

    const totalRevenue = revenueData._sum.amount || BigInt(0);
    const avgPaymentAmount = revenueData._avg.amount || BigInt(0);

    // Recent payments - optimized with select instead of include
    const recentPayments = await this.prisma.payment.findMany({
      where: {
        intent: {
          merchantId,
        },
      },
      take: 10,
      orderBy: { confirmedAt: 'desc' },
      select: {
        id: true,
        txSignature: true,
        amount: true,
        currency: true,
        payerWallet: true,
        confirmedAt: true,
        intent: {
          select: {
            content: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    return {
      merchant: {
        id: merchant.id,
        email: merchant.email,
        status: merchant.status,
        payoutAddress: merchant.payoutAddress,
        createdAt: merchant.createdAt,
      },
      stats: {
        totalPayments,
        todayPayments,
        weekPayments,
        monthPayments,
        totalRevenue: totalRevenue.toString(),
        avgPaymentAmount: avgPaymentAmount.toString(),
      },
      recentPayments: recentPayments.map((p: typeof recentPayments[0]) => ({
        id: p.id,
        txSignature: p.txSignature,
        amount: p.amount.toString(),
        currency: p.currency,
        payerWallet: p.payerWallet,
        confirmedAt: p.confirmedAt,
        content: p.intent.content.slug,
      })),
    };
  }
}

