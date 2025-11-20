import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMerchantDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  payoutAddress?: string; // Solana wallet address

  @IsString()
  @IsOptional()
  webhookSecret?: string;
}

