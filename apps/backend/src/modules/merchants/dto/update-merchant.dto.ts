import { IsString, IsOptional, IsEnum, IsObject, IsUrl } from 'class-validator';

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

  // Profile fields
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsUrl()
  @IsOptional()
  twitterUrl?: string;

  @IsUrl()
  @IsOptional()
  telegramUrl?: string;

  @IsUrl()
  @IsOptional()
  discordUrl?: string;

  @IsUrl()
  @IsOptional()
  githubUrl?: string;
}

