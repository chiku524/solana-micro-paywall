import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import { SolanaService } from '../solana/solana.service';

@Injectable()
export class HealthService extends HealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly solana: SolanaService,
  ) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    return this.getStatus('api', true);
  }

  async checkDatabase(): Promise<{ status: string; message?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async checkSolana(): Promise<{ status: string; slot?: number; message?: string }> {
    try {
      const slot = await this.solana.getCurrentSlot();
      return { status: 'ok', slot };
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

