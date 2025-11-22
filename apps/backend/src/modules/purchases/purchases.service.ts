import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get all purchases for a wallet address
   */
  async getPurchasesByWallet(walletAddress: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `purchases:${walletAddress}:${page}:${limit}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [purchases, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where: { walletAddress },
        include: {
          content: {
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              thumbnailUrl: true,
              category: true,
              priceLamports: true,
              currency: true,
            },
          },
          merchant: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.purchase.count({
        where: { walletAddress },
      }),
    ]);

    const result = {
      purchases: purchases.map((p: any) => ({
        id: p.id,
        walletAddress: p.walletAddress,
        purchasedAt: p.purchasedAt,
        expiresAt: p.expiresAt,
        content: {
          ...p.content,
          priceLamports: p.content.priceLamports.toString(),
        },
        merchant: p.merchant,
        accessToken: p.accessTokenId ? '***' : null, // Don't expose full token
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cache for 1 minute
    await this.cacheService.set(cacheKey, result, 60);
    return result;
  }

  /**
   * Get a specific purchase by ID
   */
  async getPurchaseById(id: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        content: true,
        merchant: {
          select: {
            id: true,
            email: true,
          },
        },
        payment: {
          select: {
            txSignature: true,
            amount: true,
            currency: true,
            confirmedAt: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase not found: ${id}`);
    }

    return {
      ...purchase,
      content: {
        ...purchase.content,
        priceLamports: purchase.content.priceLamports.toString(),
      },
    };
  }

  /**
   * Check if wallet has access to content
   */
  async hasAccess(walletAddress: string, merchantId: string, contentSlug: string): Promise<boolean> {
    const purchase = await this.prisma.purchase.findFirst({
      where: {
        walletAddress,
        merchant: { id: merchantId },
        content: { slug: contentSlug },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        accessToken: true,
      },
    });

    if (!purchase) {
      return false;
    }

    // Check if access token is still valid
    if (purchase.accessToken) {
      const now = new Date();
      if (purchase.accessToken.expiresAt > now && !purchase.accessToken.redeemedAt) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate a shareable link for a purchase
   * The link includes a token that allows access verification
   */
  async generateShareableLink(purchaseId: string, walletAddress: string): Promise<{ shareableLink: string; shareToken: string }> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        content: true,
        merchant: true,
        accessToken: true,
      },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase not found: ${purchaseId}`);
    }

    // Verify the wallet owns this purchase
    if (purchase.walletAddress !== walletAddress) {
      throw new Error('Unauthorized: Cannot generate shareable link for another wallet\'s purchase');
    }

    // Check if access is still valid
    if (purchase.expiresAt && purchase.expiresAt < new Date()) {
      throw new Error('Purchase has expired');
    }

    // Generate a share token (using access token JTI for now, or create a separate share token)
    const shareToken = purchase.accessToken?.tokenJti || purchase.id;
    
    // Generate shareable link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const shareableLink = `${baseUrl}/share/${purchase.id}?token=${shareToken}`;

    return { shareableLink, shareToken };
  }

  /**
   * Verify access via shareable link token
   */
  async verifyShareableAccess(shareToken: string, purchaseId: string): Promise<{ hasAccess: boolean; purchase?: any }> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        content: true,
        merchant: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        accessToken: true,
      },
    });

    if (!purchase) {
      return { hasAccess: false };
    }

    // Verify token matches
    const expectedToken = purchase.accessToken?.tokenJti || purchase.id;
    if (shareToken !== expectedToken) {
      return { hasAccess: false };
    }

    // Check if access is still valid
    if (purchase.expiresAt && purchase.expiresAt < new Date()) {
      return { hasAccess: false };
    }

    // Check if access token is still valid
    if (purchase.accessToken) {
      const now = new Date();
      if (purchase.accessToken.expiresAt <= now || purchase.accessToken.redeemedAt) {
        return { hasAccess: false };
      }
    }

    return {
      hasAccess: true,
      purchase: {
        id: purchase.id,
        content: {
          ...purchase.content,
          priceLamports: purchase.content.priceLamports.toString(),
        },
        merchant: purchase.merchant,
        purchasedAt: purchase.purchasedAt,
        expiresAt: purchase.expiresAt,
      },
    };
  }
}

