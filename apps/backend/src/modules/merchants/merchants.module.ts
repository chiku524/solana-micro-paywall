import { Module } from '@nestjs/common';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';
import { MerchantsFollowService } from './merchants-follow.service';
import { DatabaseModule } from '../database/database.module';
import { SolanaModule } from '../solana/solana.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [DatabaseModule, SolanaModule, CacheModule],
  controllers: [MerchantsController],
  providers: [MerchantsService, MerchantsFollowService],
  exports: [MerchantsService, MerchantsFollowService],
})
export class MerchantsModule {}

