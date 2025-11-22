import { Controller, Get, Param, Query, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Merchant } from '../../common/decorators/merchant.decorator';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('conversion/:merchantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get conversion rate for a merchant' })
  async getConversionRate(
    @Param('merchantId') merchantId: string,
    @Query('days') days?: string,
    @Merchant() user?: any,
  ) {
    // Merchants can only view their own analytics
    if (user && merchantId !== user.merchantId) {
      throw new Error('Unauthorized: Cannot view another merchant\'s analytics');
    }
    return this.analyticsService.getConversionRate(merchantId, days ? parseInt(days, 10) : 30);
  }

  @Get('top-content')
  @Public()
  @ApiOperation({ summary: 'Get top content by sales' })
  async getTopContent(
    @Query('merchantId') merchantId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTopContent(merchantId, limit ? parseInt(limit, 10) : 10);
  }

  @Get('performance/:merchantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get merchant performance metrics' })
  async getMerchantPerformance(
    @Param('merchantId') merchantId: string,
    @Query('days') days?: string,
    @Merchant() user?: any,
  ) {
    // Merchants can only view their own analytics
    if (user && merchantId !== user.merchantId) {
      throw new Error('Unauthorized: Cannot view another merchant\'s analytics');
    }
    return this.analyticsService.getMerchantPerformance(merchantId, days ? parseInt(days, 10) : 30);
  }
}

