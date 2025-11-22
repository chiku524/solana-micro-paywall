import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
export class PurchasesController {
  private readonly logger = new Logger(PurchasesController.name);

  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @Public()
  async getPurchases(
    @Query('walletAddress') walletAddress: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!walletAddress) {
      throw new Error('walletAddress query parameter is required');
    }

    return this.purchasesService.getPurchasesByWallet(walletAddress, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @Public()
  async getPurchase(@Param('id') id: string) {
    return this.purchasesService.getPurchaseById(id);
  }

  @Get('check-access')
  @Public()
  async checkAccess(
    @Query('walletAddress') walletAddress: string,
    @Query('merchantId') merchantId: string,
    @Query('contentSlug') contentSlug: string,
  ) {
    if (!walletAddress || !merchantId || !contentSlug) {
      throw new Error('walletAddress, merchantId, and contentSlug are required');
    }

    const hasAccess = await this.purchasesService.hasAccess(walletAddress, merchantId, contentSlug);
    return { hasAccess };
  }

  @Get(':id/shareable-link')
  @Public()
  async generateShareableLink(
    @Param('id') purchaseId: string,
    @Query('walletAddress') walletAddress: string,
  ) {
    if (!walletAddress) {
      throw new Error('walletAddress query parameter is required');
    }
    return this.purchasesService.generateShareableLink(purchaseId, walletAddress);
  }

  @Get('share/:id/verify')
  @Public()
  async verifyShareableAccess(
    @Param('id') purchaseId: string,
    @Query('token') token: string,
  ) {
    if (!token) {
      throw new Error('token query parameter is required');
    }
    return this.purchasesService.verifyShareableAccess(token, purchaseId);
  }
}

