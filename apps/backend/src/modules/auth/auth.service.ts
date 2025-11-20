import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MerchantsService } from '../merchants/merchants.service';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // merchantId
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  accessToken: string;
  merchant: {
    id: string;
    email: string;
    status: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly merchantsService: MerchantsService,
    private readonly configService: ConfigService,
  ) {}

  async login(merchantId: string): Promise<AuthResponse> {
    const merchantData = await this.merchantsService.findOne(merchantId);
    let merchant = merchantData as any; // Type assertion for cached data
    
    if (!merchant) {
      throw new UnauthorizedException('Merchant not found');
    }

    // Auto-activate pending merchants for development/testing
    if (merchant.status === 'pending') {
      merchant = await this.merchantsService.update(merchantId, { status: 'active' });
    }

    if (merchant.status !== 'active') {
      throw new UnauthorizedException(`Merchant status is ${merchant.status}, must be active`);
    }

    const payload: JwtPayload = {
      sub: merchant.id,
      email: merchant.email,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        status: merchant.status,
      },
    };
  }

  async validateMerchant(payload: JwtPayload) {
    const merchantData = await this.merchantsService.findOne(payload.sub);
    let merchant = merchantData as any; // Type assertion for cached data
    
    if (!merchant) {
      throw new UnauthorizedException('Invalid merchant');
    }

    // Auto-activate pending merchants for development/testing
    if (merchant.status === 'pending') {
      merchant = await this.merchantsService.update(payload.sub, { status: 'active' });
    }

    if (merchant.status !== 'active') {
      throw new UnauthorizedException('Invalid merchant');
    }

    return merchant;
  }
}

