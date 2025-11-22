import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Generate a new API key
   */
  private generateApiKey(prefix: string = 'sk_live'): { key: string; hash: string; prefix: string } {
    const randomPart = randomBytes(32).toString('base64url');
    const key = `${prefix}_${randomPart}`;
    const hash = createHash('sha256').update(key).digest('hex');
    const keyPrefix = key.substring(0, 12); // e.g., "sk_live_abc"

    return { key, hash, prefix: keyPrefix };
  }

  /**
   * Create a new API key for a merchant
   */
  async createApiKey(data: {
    merchantId: string;
    name: string;
    rateLimit?: number;
    allowedIps?: string[];
    expiresAt?: Date;
  }) {
    const { merchantId, name, rateLimit, allowedIps, expiresAt } = data;

    // Verify merchant exists
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant not found: ${merchantId}`);
    }

    // Generate API key
    const { key, hash, prefix } = this.generateApiKey();

    // Create API key record (store hash, not plain key)
    const apiKey = await this.prisma.apiKey.create({
      data: {
        merchantId,
        name,
        keyHash: hash,
        keyPrefix: prefix,
        rateLimit,
        allowedIps: allowedIps || [],
        expiresAt,
        isActive: true,
      },
    });

    this.logger.log(`Created API key ${prefix}... for merchant ${merchantId}`);

    // Return the plain key only once (client should save it)
    return {
      ...apiKey,
      key, // Only returned on creation
    };
  }

  /**
   * Verify an API key
   */
  async verifyApiKey(apiKey: string, ipAddress?: string): Promise<{ apiKey: any; merchantId: string }> {
    const hash = createHash('sha256').update(apiKey).digest('hex');

    const keyRecord = await this.prisma.apiKey.findUnique({
      where: { keyHash: hash },
      include: {
        merchant: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!keyRecord.isActive) {
      throw new UnauthorizedException('API key is inactive');
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Check IP whitelist if configured
    if (keyRecord.allowedIps.length > 0 && ipAddress) {
      if (!keyRecord.allowedIps.includes(ipAddress)) {
        throw new UnauthorizedException('IP address not allowed');
      }
    }

    // Check merchant status
    if (keyRecord.merchant.status !== 'active') {
      throw new UnauthorizedException('Merchant account is not active');
    }

    // Update last used timestamp (async, don't wait)
    this.prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch((err) => {
      this.logger.warn(`Failed to update API key last used timestamp: ${err.message}`);
    });

    return {
      apiKey: keyRecord,
      merchantId: keyRecord.merchantId,
    };
  }

  /**
   * Log API key usage
   */
  async logUsage(data: {
    apiKeyId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime?: number;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.apiKeyUsage.create({
        data,
      });
    } catch (error) {
      // Don't fail the request if logging fails
      this.logger.warn(`Failed to log API key usage: ${error}`);
    }
  }

  /**
   * List API keys for a merchant
   */
  async listApiKeys(merchantId: string) {
    return this.prisma.apiKey.findMany({
      where: { merchantId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        lastUsedAt: true,
        rateLimit: true,
        createdAt: true,
        expiresAt: true,
        _count: {
          select: {
            usageLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(merchantId: string, apiKeyId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        merchantId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key not found: ${apiKeyId}`);
    }

    return this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { isActive: false },
    });
  }

  /**
   * Get API key usage statistics
   */
  async getUsageStats(merchantId: string, apiKeyId?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      createdAt: { gte: startDate },
      apiKey: {
        merchantId,
        ...(apiKeyId ? { id: apiKeyId } : {}),
      },
    };

    const [totalRequests, successfulRequests, failedRequests, avgResponseTime] = await Promise.all([
      this.prisma.apiKeyUsage.count({ where }),
      this.prisma.apiKeyUsage.count({
        where: {
          ...where,
          statusCode: { gte: 200, lt: 300 },
        },
      }),
      this.prisma.apiKeyUsage.count({
        where: {
          ...where,
          statusCode: { gte: 400 },
        },
      }),
      this.prisma.apiKeyUsage.aggregate({
        where,
        _avg: {
          responseTime: true,
        },
      }),
    ]);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      avgResponseTime: avgResponseTime._avg.responseTime || 0,
    };
  }
}

