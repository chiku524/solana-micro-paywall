import { Controller, Get, Post, Delete, Body, Param, Query, Logger, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Merchant } from '../../common/decorators/merchant.decorator';

@ApiTags('api-keys')
@Controller('api-keys')
export class ApiKeysController {
  private readonly logger = new Logger(ApiKeysController.name);

  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new API key' })
  async createApiKey(
    @Body() body: {
      name: string;
      rateLimit?: number;
      allowedIps?: string[];
      expiresAt?: string;
    },
    @Merchant() user: any,
  ) {
    return this.apiKeysService.createApiKey({
      merchantId: user.merchantId,
      name: body.name,
      rateLimit: body.rateLimit,
      allowedIps: body.allowedIps,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List API keys for the authenticated merchant' })
  async listApiKeys(@Merchant() user: any) {
    return this.apiKeysService.listApiKeys(user.merchantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke an API key' })
  async revokeApiKey(@Param('id') id: string, @Merchant() user: any) {
    return this.apiKeysService.revokeApiKey(user.merchantId, id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get API key usage statistics' })
  async getUsageStats(
    @Query('apiKeyId') apiKeyId: string | undefined,
    @Query('days') days: string | undefined,
    @Merchant() user: any,
  ) {
    return this.apiKeysService.getUsageStats(
      user.merchantId,
      apiKeyId,
      days ? parseInt(days, 10) : 30,
    );
  }
}

