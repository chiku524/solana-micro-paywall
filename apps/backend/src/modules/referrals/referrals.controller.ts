import { Controller, Get, Post, Body, Param, Query, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Merchant } from '../../common/decorators/merchant.decorator';

@ApiTags('referrals')
@Controller('referrals')
export class ReferralsController {
  private readonly logger = new Logger(ReferralsController.name);

  constructor(private readonly referralsService: ReferralsService) {}

  @Post('codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a referral code' })
  async createReferralCode(
    @Body() body: {
      merchantId?: string;
      referrerWallet?: string;
      discountPercent?: number;
      discountAmount?: string;
      maxUses?: number;
      expiresAt?: string;
      customCode?: string;
    },
    @Merchant() user: any,
  ) {
    // Merchants can only create codes for themselves
    if (body.merchantId && body.merchantId !== user.merchantId) {
      throw new Error('Unauthorized: Cannot create referral code for another merchant');
    }

    return this.referralsService.createReferralCode({
      ...body,
      merchantId: body.merchantId || user.merchantId,
      discountAmount: body.discountAmount ? BigInt(body.discountAmount) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
  }

  @Get('codes/:code')
  @Public()
  @ApiOperation({ summary: 'Get referral code details' })
  async getReferralCode(@Param('code') code: string) {
    return this.referralsService.getReferralCode(code);
  }

  @Get('codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List referral codes' })
  async listReferralCodes(
    @Query('merchantId') merchantId?: string,
    @Query('referrerWallet') referrerWallet?: string,
    @Query('isActive') isActive?: string,
    @Merchant() user?: any,
  ) {
    // Merchants can only view their own codes
    if (merchantId && merchantId !== user?.merchantId) {
      throw new Error('Unauthorized: Cannot view another merchant\'s referral codes');
    }

    return this.referralsService.listReferralCodes({
      merchantId: merchantId || user?.merchantId,
      referrerWallet,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Post('apply')
  @Public()
  @ApiOperation({ summary: 'Apply referral code to a purchase' })
  async applyReferralCode(
    @Body() body: {
      code: string;
      referrerWallet: string;
      refereeWallet: string;
      purchaseId: string;
      originalAmount: string;
    },
  ) {
    return this.referralsService.applyReferralCode(
      body.code,
      body.referrerWallet,
      body.refereeWallet,
      body.purchaseId,
      BigInt(body.originalAmount),
    );
  }

  @Get('stats/:walletAddress')
  @Public()
  @ApiOperation({ summary: 'Get referral statistics for a wallet' })
  async getReferralStats(@Param('walletAddress') walletAddress: string) {
    return this.referralsService.getReferralStats(walletAddress);
  }
}

