import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  merchantId!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceLamports!: number; // Price in lamports (1 SOL = 1e9 lamports)

  @IsString()
  @IsEnum(['SOL', 'USDC', 'PYUSD'])
  @IsOptional()
  currency?: string = 'SOL';

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  durationSecs?: number | null; // Access duration in seconds (null = one-time)

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
  visibility?: string = 'private';

  @IsString()
  @IsOptional()
  canonicalUrl?: string;

  @IsString()
  @IsOptional()
  previewText?: string;
}

