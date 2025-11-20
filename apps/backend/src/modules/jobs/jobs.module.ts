import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PaymentVerificationProcessor } from './payment-verification.processor';
import { CleanupProcessor } from './cleanup.processor';
import { PaymentsModule } from '../payments/payments.module';
import { SolanaModule } from '../solana/solana.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          try {
            const url = new URL(redisUrl);
            const isTLS = redisUrl.startsWith('rediss://');
            
            return {
              connection: {
                host: url.hostname,
                port: parseInt(url.port) || 6379,
                password: url.password || undefined,
                username: url.username || undefined,
                maxRetriesPerRequest: null, // Don't retry if Redis is unavailable
                // TLS configuration for Upstash
                ...(isTLS && {
                  tls: {
                    rejectUnauthorized: true,
                  },
                }),
              },
            };
          } catch {
            // If URL parsing fails, return empty (will use default)
            return {};
          }
        }
        // Return empty config - BullMQ will use in-memory storage
        return {};
      },
    }),
    BullModule.registerQueue({
      name: 'payment-verification',
    }),
    forwardRef(() => PaymentsModule),
    SolanaModule,
    DatabaseModule,
  ],
  providers: [PaymentVerificationProcessor, CleanupProcessor],
})
export class JobsModule {}

