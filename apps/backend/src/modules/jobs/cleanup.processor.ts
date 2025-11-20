import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredIntents() {
    try {
      const count = await this.paymentsService.cleanupExpiredIntents();
      if (count > 0) {
        this.logger.log(`Cleaned up ${count} expired payment intents`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired intents', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    try {
      const result = await this.prisma.accessToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
          redeemedAt: { not: null },
        },
      });
      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired tokens`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens', error);
    }
  }
}

