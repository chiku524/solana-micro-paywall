import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DatabaseModule } from '../database/database.module';
import { SolanaModule } from '../solana/solana.module';
import { TokensModule } from '../tokens/tokens.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ConfigModule, DatabaseModule, SolanaModule, TokensModule, WebhooksModule, CacheModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

