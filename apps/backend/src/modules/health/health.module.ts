import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from '../database/database.module';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [TerminusModule, DatabaseModule, SolanaModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}

