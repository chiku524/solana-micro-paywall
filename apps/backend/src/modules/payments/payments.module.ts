import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DatabaseModule } from '../database/database.module';
import { SolanaModule } from '../solana/solana.module';
import { TokensModule } from '../tokens/tokens.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { CacheModule } from '../cache/cache.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    SolanaModule,
    TokensModule,
    WebhooksModule,
    CacheModule,
    forwardRef(() => AnalyticsModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

