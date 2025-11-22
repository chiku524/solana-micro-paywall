import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Get API key from header
    const apiKey = request.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Get IP address
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || request.connection.remoteAddress;

    try {
      // Verify API key
      const { merchantId } = await this.apiKeysService.verifyApiKey(apiKey, ipAddress as string);
      
      // Attach merchant ID to request
      (request as any).merchantId = merchantId;
      (request as any).apiKey = apiKey;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired API key');
    }
  }
}

