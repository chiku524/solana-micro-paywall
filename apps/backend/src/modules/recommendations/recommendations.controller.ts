import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  private readonly logger = new Logger(RecommendationsController.name);

  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('for-wallet')
  @Public()
  async getRecommendationsForWallet(
    @Query('walletAddress') walletAddress: string,
    @Query('limit') limit?: string,
  ) {
    if (!walletAddress) {
      throw new Error('walletAddress query parameter is required');
    }

    const limitNum = limit ? parseInt(limit, 10) : 6;
    return this.recommendationsService.getRecommendationsForWallet(walletAddress, limitNum);
  }

  @Get('for-content/:contentId')
  @Public()
  async getRecommendationsForContent(
    @Param('contentId') contentId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 6;
    return this.recommendationsService.getRecommendationsForContent(contentId, limitNum);
  }

  @Get('collaborative/:contentId')
  @Public()
  async getCollaborativeRecommendations(
    @Param('contentId') contentId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 6;
    return this.recommendationsService.getCollaborativeRecommendations(contentId, limitNum);
  }
}

