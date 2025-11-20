import { IsString, IsOptional, IsNumber, Min, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  priceLamports?: number;

  @IsString()
  @IsEnum(['SOL', 'USDC', 'PYUSD'])
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  durationSecs?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  // Discovery & Presentation Fields
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsOptional()
  tags?: string[];

  @IsString()
  @IsEnum(['public', 'private', 'unlisted'])
  @IsOptional()
  visibility?: string;

  @IsString()
  @IsOptional()
  canonicalUrl?: string;

  @IsString()
  @IsOptional()
  previewText?: string;
}

