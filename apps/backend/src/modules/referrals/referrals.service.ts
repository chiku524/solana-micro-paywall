import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Generate a unique referral code
   */
  private generateCode(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a referral code
   */
  async createReferralCode(data: {
    merchantId?: string;
    referrerWallet?: string;
    discountPercent?: number;
    discountAmount?: bigint;
    maxUses?: number;
    expiresAt?: Date;
    customCode?: string;
  }) {
    const { merchantId, referrerWallet, discountPercent, discountAmount, maxUses, expiresAt, customCode } = data;

    // Validate discount
    if (discountPercent && (discountPercent < 0 || discountPercent > 100)) {
      throw new BadRequestException('Discount percent must be between 0 and 100');
    }

    if (discountPercent && discountAmount) {
      throw new BadRequestException('Cannot specify both discountPercent and discountAmount');
    }

    if (!discountPercent && !discountAmount) {
      throw new BadRequestException('Must specify either discountPercent or discountAmount');
    }

    // Generate unique code
    let code = customCode;
    if (!code) {
      let attempts = 0;
      do {
        code = this.generateCode(8);
        attempts++;
        if (attempts > 10) {
          throw new Error('Failed to generate unique referral code');
        }
      } while (await this.prisma.referralCode.findUnique({ where: { code } }));
    } else {
      // Check if custom code is available
      const existing = await this.prisma.referralCode.findUnique({ where: { code } });
      if (existing) {
        throw new BadRequestException(`Referral code "${code}" already exists`);
      }
    }

    const referralCode = await this.prisma.referralCode.create({
      data: {
        code,
        merchantId,
        referrerWallet,
        discountPercent,
        discountAmount,
        maxUses,
        expiresAt,
        isActive: true,
      },
    });

    this.logger.log(`Created referral code: ${code} for merchant ${merchantId || 'global'}`);
    return referralCode;
  }

  /**
   * Get referral code details
   */
  async getReferralCode(code: string) {
    const cacheKey = `referral:code:${code}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code },
      include: {
        _count: {
          select: {
            referrals: true,
          },
        },
      },
    });

    if (!referralCode) {
      throw new NotFoundException(`Referral code not found: ${code}`);
    }

    // Check if code is still valid
    if (!referralCode.isActive) {
      throw new BadRequestException('Referral code is inactive');
    }

    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      throw new BadRequestException('Referral code has expired');
    }

    if (referralCode.maxUses && referralCode.currentUses >= referralCode.maxUses) {
      throw new BadRequestException('Referral code has reached maximum uses');
    }

    const result = {
      ...referralCode,
      discountAmount: referralCode.discountAmount?.toString(),
      uses: referralCode._count.referrals,
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Apply referral code to a purchase
   */
  async applyReferralCode(
    code: string,
    referrerWallet: string,
    refereeWallet: string,
    purchaseId: string,
    originalAmount: bigint,
  ) {
    const referralCode = await this.getReferralCode(code);

    // Calculate discount
    let discountAmount = BigInt(0);
    if (referralCode.discountPercent) {
      discountAmount = (originalAmount * BigInt(referralCode.discountPercent)) / BigInt(100);
    } else if (referralCode.discountAmount) {
      discountAmount = BigInt(referralCode.discountAmount);
    }

    // Ensure discount doesn't exceed original amount
    if (discountAmount > originalAmount) {
      discountAmount = originalAmount;
    }

    // Calculate reward for referrer (optional: 10% of discount as reward)
    const rewardAmount = discountAmount / BigInt(10); // 10% of discount

    // Create referral record
    const referral = await this.prisma.$transaction(async (tx) => {
      // Update referral code usage
      await tx.referralCode.update({
        where: { id: referralCode.id },
        data: {
          currentUses: { increment: 1 },
        },
      });

      // Create referral record
      return tx.referral.create({
        data: {
          referralCodeId: referralCode.id,
          referrerWallet,
          refereeWallet,
          purchaseId,
          discountAmount,
          rewardAmount,
        },
      });
    });

    // Invalidate cache
    await this.cacheService.del(`referral:code:${code}`);

    this.logger.log(`Applied referral code ${code} to purchase ${purchaseId}`);
    return {
      referral,
      discountAmount: discountAmount.toString(),
      rewardAmount: rewardAmount.toString(),
    };
  }

  /**
   * Get referral statistics for a wallet
   */
  async getReferralStats(walletAddress: string) {
    const cacheKey = `referral:stats:${walletAddress}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [codesCreated, referralsMade, totalRewards] = await Promise.all([
      this.prisma.referralCode.count({
        where: { referrerWallet: walletAddress },
      }),
      this.prisma.referral.count({
        where: { referrerWallet: walletAddress },
      }),
      this.prisma.referral.aggregate({
        where: { referrerWallet: walletAddress },
        _sum: { rewardAmount: true },
      }),
    ]);

    const result = {
      codesCreated,
      referralsMade,
      totalRewards: totalRewards._sum.rewardAmount?.toString() || '0',
    };

    // Cache for 1 minute
    await this.cacheService.set(cacheKey, result, 60);
    return result;
  }

  /**
   * List referral codes for a merchant or wallet
   */
  async listReferralCodes(filters: {
    merchantId?: string;
    referrerWallet?: string;
    isActive?: boolean;
  }) {
    const where: any = {};
    if (filters.merchantId) where.merchantId = filters.merchantId;
    if (filters.referrerWallet) where.referrerWallet = filters.referrerWallet;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.referralCode.findMany({
      where,
      include: {
        _count: {
          select: {
            referrals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

