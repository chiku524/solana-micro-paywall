import { IsString, IsNotEmpty } from 'class-validator';

export class RedeemTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

