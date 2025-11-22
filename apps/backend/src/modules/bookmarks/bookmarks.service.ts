import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class BookmarksService {
  private readonly logger = new Logger(BookmarksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Add a bookmark
   */
  async addBookmark(walletAddress: string, contentId: string) {
    const bookmark = await this.prisma.bookmark.upsert({
      where: {
        walletAddress_contentId: {
          walletAddress,
          contentId,
        },
      },
      create: {
        walletAddress,
        contentId,
      },
      update: {},
    });

    // Invalidate cache
    await this.cacheService.del(`bookmarks:${walletAddress}`);

    return bookmark;
  }

  /**
   * Remove a bookmark
   */
  async removeBookmark(walletAddress: string, contentId: string) {
    await this.prisma.bookmark.deleteMany({
      where: {
        walletAddress,
        contentId,
      },
    });

    // Invalidate cache
    await this.cacheService.del(`bookmarks:${walletAddress}`);

    return { success: true };
  }

  /**
   * Get all bookmarks for a wallet
   */
  async getBookmarks(walletAddress: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `bookmarks:${walletAddress}:${page}:${limit}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { walletAddress },
        include: {
          content: {
            include: {
              merchant: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bookmark.count({
        where: { walletAddress },
      }),
    ]);

    const result = {
      bookmarks: bookmarks.map((b: any) => ({
        id: b.id,
        createdAt: b.createdAt,
        content: {
          ...b.content,
          priceLamports: b.content.priceLamports.toString(),
        },
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
   * Check if content is bookmarked
   */
  async isBookmarked(walletAddress: string, contentId: string): Promise<boolean> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        walletAddress_contentId: {
          walletAddress,
          contentId,
        },
      },
    });

    return !!bookmark;
  }
}

