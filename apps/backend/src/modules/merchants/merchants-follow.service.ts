import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class MerchantsFollowService {
  private readonly logger = new Logger(MerchantsFollowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Follow a merchant
   */
  async followMerchant(walletAddress: string, merchantId: string) {
    const follow = await this.prisma.merchantFollow.upsert({
      where: {
        walletAddress_merchantId: {
          walletAddress,
          merchantId,
        },
      },
      create: {
        walletAddress,
        merchantId,
      },
      update: {},
    });

    // Invalidate cache
    await this.cacheService.del(`merchant:${merchantId}:followers`);
    await this.cacheService.del(`wallet:${walletAddress}:following`);

    return follow;
  }

  /**
   * Unfollow a merchant
   */
  async unfollowMerchant(walletAddress: string, merchantId: string) {
    await this.prisma.merchantFollow.deleteMany({
      where: {
        walletAddress,
        merchantId,
      },
    });

    // Invalidate cache
    await this.cacheService.del(`merchant:${merchantId}:followers`);
    await this.cacheService.del(`wallet:${walletAddress}:following`);

    return { success: true };
  }

  /**
   * Check if wallet is following merchant
   */
  async isFollowing(walletAddress: string, merchantId: string): Promise<boolean> {
    const follow = await this.prisma.merchantFollow.findUnique({
      where: {
        walletAddress_merchantId: {
          walletAddress,
          merchantId,
        },
      },
    });

    return !!follow;
  }

  /**
   * Get all merchants a wallet is following
   */
  async getFollowing(walletAddress: string) {
    const cacheKey = `wallet:${walletAddress}:following`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const follows = await this.prisma.merchantFollow.findMany({
      where: { walletAddress },
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = follows.map((f: any) => f.merchant);

    // Cache for 1 minute
    await this.cacheService.set(cacheKey, result, 60);
    return result;
  }

  /**
   * Get merchant's follower count
   */
  async getFollowerCount(merchantId: string): Promise<number> {
    const cacheKey = `merchant:${merchantId}:followers:count`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached !== null && typeof cached === 'number') {
      return cached;
    }

    const count = await this.prisma.merchantFollow.count({
      where: { merchantId },
    });

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, count, 300);
    return count;
  }
}

