import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class UpdateMerchantDto {
  @IsString()
  @IsOptional()
  payoutAddress?: string;

  @IsString()
  @IsOptional()
  webhookSecret?: string;

  @IsEnum(['pending', 'active', 'suspended', 'kyc_required'])
  @IsOptional()
  status?: string;

  @IsObject()
  @IsOptional()
  configJson?: Record<string, any>;
}

