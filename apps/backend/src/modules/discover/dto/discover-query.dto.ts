import { IsOptional, IsString, IsNumber, Min, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class DiscoverQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  @IsIn(['SOL', 'USDC', 'PYUSD'])
  currency?: string;

  @IsOptional()
  @IsString()
  @IsIn(['newest', 'popular', 'price_asc', 'price_desc'])
  sort?: 'newest' | 'popular' | 'price_asc' | 'price_desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

