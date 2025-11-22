import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          // Multiple throttler tiers for different endpoint types
          throttlers: [
            {
              name: 'default',
              ttl: 60000, // 1 minute
              limit: 100, // Max requests per window
            },
            {
              name: 'payment',
              ttl: 60000, // 1 minute
              limit: 10, // Stricter limit for payment endpoints
            },
            {
              name: 'strict',
              ttl: 60000, // 1 minute
              limit: 5, // Very strict limit for sensitive operations
            },
            {
              name: 'api-key',
              ttl: 60000, // 1 minute
              limit: 1000, // Higher limit for API key authenticated requests
            },
          ],
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class RateLimitModule {}

