import { Controller, Get, Post, Delete, Query, Body, Param, Logger } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { BookmarksService } from './bookmarks.service';

@Controller('bookmarks')
export class BookmarksController {
  private readonly logger = new Logger(BookmarksController.name);

  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  @Public()
  async getBookmarks(
    @Query('walletAddress') walletAddress: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!walletAddress) {
      throw new Error('walletAddress query parameter is required');
    }

    return this.bookmarksService.getBookmarks(walletAddress, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @Public()
  async addBookmark(@Body() body: { walletAddress: string; contentId: string }) {
    if (!body.walletAddress || !body.contentId) {
      throw new Error('walletAddress and contentId are required');
    }

    return this.bookmarksService.addBookmark(body.walletAddress, body.contentId);
  }

  @Delete(':contentId')
  @Public()
  async removeBookmark(
    @Param('contentId') contentId: string,
    @Query('walletAddress') walletAddress: string,
  ) {
    if (!walletAddress) {
      throw new Error('walletAddress query parameter is required');
    }

    return this.bookmarksService.removeBookmark(walletAddress, contentId);
  }

  @Get('check')
  @Public()
  async isBookmarked(
    @Query('walletAddress') walletAddress: string,
    @Query('contentId') contentId: string,
  ) {
    if (!walletAddress || !contentId) {
      throw new Error('walletAddress and contentId are required');
    }

    const isBookmarked = await this.bookmarksService.isBookmarked(walletAddress, contentId);
    return { isBookmarked };
  }
}

