import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  merchantId!: string;

  @IsString()
  @IsNotEmpty()
  contentId!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number; // Override content price if provided (in lamports)

  @IsString()
  @IsEnum(['SOL', 'USDC', 'PYUSD'])
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  duration?: number; // Override content duration if provided (in seconds)
}

