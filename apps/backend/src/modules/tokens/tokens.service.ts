import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { sign, verify, decode } from 'jsonwebtoken';
import { randomBytes } from 'crypto';

interface TokenPayload {
  jti: string;
  merchantId: string;
  contentId?: string;
  paymentId?: string;
  exp: number;
  iat: number;
}

interface CreateAccessTokenParams {
  merchantId: string;
  contentId?: string;
  paymentId?: string;
  expiresAt: Date;
}

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  private readonly jwtSecret: string;
  private readonly jwtPrivateKey?: string;
  private readonly jwtPublicKey?: string;
  private readonly algorithm: 'HS256' | 'RS256';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'change-me-to-a-secure-secret-in-production-minimum-32-chars';
    this.jwtPrivateKey = this.configService.get<string>('JWT_PRIVATE_KEY');
    this.jwtPublicKey = this.configService.get<string>('JWT_PUBLIC_KEY');

    // Use RS256 if keys are provided, otherwise use HS256
    this.algorithm = this.jwtPrivateKey && this.jwtPublicKey ? 'RS256' : 'HS256';

    if (this.algorithm === 'HS256' && this.jwtSecret.length < 32) {
      this.logger.warn('JWT_SECRET is too short, should be at least 32 characters');
    }
  }

  /**
   * Create an access token record in the database
   */
  async createAccessToken(params: CreateAccessTokenParams) {
    const { merchantId, contentId, paymentId, expiresAt } = params;

    // Generate unique JTI (JWT ID)
    const tokenJti = `jwt_${Date.now()}_${randomBytes(8).toString('hex')}`;

    const accessToken = await this.prisma.accessToken.create({
      data: {
        merchantId,
        contentId,
        paymentId,
        tokenJti,
        expiresAt,
      },
    });

    this.logger.log(`Created access token record ${accessToken.id} with JTI ${tokenJti}`);
    return accessToken;
  }

  /**
   * Issue a JWT token from an access token record
   */
  async issueToken(tokenJti: string): Promise<string> {
    const accessToken = await this.prisma.accessToken.findUnique({
      where: { tokenJti },
      include: {
        merchant: true,
      },
    });

    if (!accessToken) {
      throw new NotFoundException(`Access token not found: ${tokenJti}`);
    }

    if (new Date(accessToken.expiresAt) < new Date()) {
      throw new UnauthorizedException(`Access token has expired: ${tokenJti}`);
    }

    const payload: TokenPayload = {
      jti: accessToken.tokenJti,
      merchantId: accessToken.merchantId,
      contentId: accessToken.contentId || undefined,
      paymentId: accessToken.paymentId || undefined,
      exp: Math.floor(new Date(accessToken.expiresAt).getTime() / 1000),
      iat: Math.floor(Date.now() / 1000),
    };

    const token = this.signToken(payload);
    this.logger.log(`Issued JWT token for JTI ${tokenJti}`);
    return token;
  }

  /**
   * Verify and decode a JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = this.verifyAndDecodeToken(token) as TokenPayload;

      // Verify token exists in database and hasn't been redeemed
      const accessToken = await this.prisma.accessToken.findUnique({
        where: { tokenJti: decoded.jti },
      });

      if (!accessToken) {
        throw new UnauthorizedException('Access token not found in database');
      }

      if (accessToken.redeemedAt) {
        throw new UnauthorizedException('Access token has already been redeemed');
      }

      if (new Date(accessToken.expiresAt) < new Date()) {
        throw new UnauthorizedException('Access token has expired');
      }

      return decoded;
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Redeem a token (mark as used)
   */
  async redeemToken(token: string): Promise<{ merchantId: string; contentId?: string; paymentId?: string }> {
    const payload = await this.verifyToken(token);

    // Mark token as redeemed
    await this.prisma.accessToken.update({
      where: { tokenJti: payload.jti },
      data: { redeemedAt: new Date() },
    });

    this.logger.log(`Token redeemed: ${payload.jti}`);

    return {
      merchantId: payload.merchantId,
      contentId: payload.contentId,
      paymentId: payload.paymentId,
    };
  }

  /**
   * Sign a JWT token
   */
  private signToken(payload: TokenPayload): string {
    if (this.algorithm === 'RS256' && this.jwtPrivateKey) {
      return sign(payload, this.jwtPrivateKey, {
        algorithm: 'RS256',
        expiresIn: payload.exp - payload.iat,
      });
    }

    return sign(payload, this.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: payload.exp - payload.iat,
    });
  }

  /**
   * Verify and decode a JWT token
   */
  private verifyAndDecodeToken(token: string): TokenPayload {
    if (this.algorithm === 'RS256' && this.jwtPublicKey) {
      return verify(token, this.jwtPublicKey, {
        algorithms: ['RS256'],
      }) as TokenPayload;
    }

    return verify(token, this.jwtSecret, {
      algorithms: ['HS256'],
    }) as TokenPayload;
  }
}

