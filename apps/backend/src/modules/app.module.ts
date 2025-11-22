import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { SolanaModule } from './solana/solana.module';
import { PaymentsModule } from './payments/payments.module';
import { TokensModule } from './tokens/tokens.module';
import { MerchantsModule } from './merchants/merchants.module';
import { ContentsModule } from './contents/contents.module';
import { DiscoverModule } from './discover/discover.module';
import { CacheModule } from './cache/cache.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { JobsModule } from './jobs/jobs.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AuthModule } from './auth/auth.module';
import { PurchasesModule } from './purchases/purchases.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ReferralsModule } from './referrals/referrals.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RequestIdMiddleware } from '../common/middleware/request-id.middleware';
import { TimeoutMiddleware } from '../common/middleware/timeout.middleware';
import { SanitizeMiddleware } from '../common/middleware/sanitize.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    CacheModule,
    RateLimitModule,
    DatabaseModule,
    HealthModule,
    SolanaModule,
    TokensModule,
    MerchantsModule,
    ContentsModule,
    PaymentsModule,
    DiscoverModule,
    JobsModule,
    WebhooksModule,
    AuthModule,
    PurchasesModule,
    BookmarksModule,
    RecommendationsModule,
    ReferralsModule,
    ApiKeysModule,
    NotificationsModule,
    AnalyticsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, TimeoutMiddleware, SanitizeMiddleware)
      .forRoutes('*');
  }
}

