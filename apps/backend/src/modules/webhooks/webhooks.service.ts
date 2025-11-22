import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createHmac } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export type WebhookEventType =
  | 'payment.confirmed'
  | 'payment.failed'
  | 'purchase.completed'
  | 'access.expiring'
  | 'access.expired'
  | 'refund.processed'
  | 'content.created'
  | 'content.updated'
  | 'merchant.follower.added';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    @InjectQueue('webhooks') private webhookQueue: Queue,
  ) {}

  /**
   * Send webhook (queued for retry on failure)
   */
  async sendWebhook(merchantId: string, event: WebhookEventType, data: any) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { webhookSecret: true, configJson: true },
    });

    if (!merchant?.webhookSecret) {
      return; // No webhook configured
    }

    const config = (merchant.configJson as any) || {};
    const webhookUrl = config.webhookUrl;
    const enabledEvents = config.enabledEvents || ['payment.confirmed', 'purchase.completed'];

    if (!webhookUrl) {
      return;
    }

    // Check if event is enabled
    if (!enabledEvents.includes(event) && enabledEvents.length > 0) {
      this.logger.debug(`Event ${event} not enabled for merchant ${merchantId}`);
      return;
    }

    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      merchantId,
    };

    const signature = this.signPayload(JSON.stringify(payload), merchant.webhookSecret);

    // Queue webhook for delivery (with retry logic)
    await this.webhookQueue.add(
      'deliver-webhook',
      {
        merchantId,
        webhookUrl,
        event,
        payload,
        signature,
        secret: merchant.webhookSecret,
      },
      {
        attempts: 5, // Retry up to 5 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
        },
      },
    );

    this.logger.log(`Webhook queued for merchant ${merchantId}, event: ${event}`);
  }

  /**
   * Deliver webhook (called by queue processor)
   */
  async deliverWebhook(job: {
    merchantId: string;
    webhookUrl: string;
    event: string;
    payload: any;
    signature: string;
    secret: string;
  }) {
    const { webhookUrl, event, payload, signature } = job;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          webhookUrl,
          payload,
          {
            headers: {
              'X-Webhook-Signature': signature,
              'X-Webhook-Event': event,
              'Content-Type': 'application/json',
              'User-Agent': 'Solana-Micro-Paywall/1.0',
            },
            timeout: 10000, // 10 second timeout
            validateStatus: (status) => status >= 200 && status < 300,
          },
        ),
      );

      this.logger.log(`Webhook delivered successfully: ${event} to ${webhookUrl}`);
      return { success: true, statusCode: response.status };
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.message || 'Unknown error';
      
      this.logger.warn(
        `Webhook delivery failed: ${event} to ${webhookUrl} - ${errorMessage} (Status: ${statusCode || 'N/A'})`,
      );
      
      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Send purchase completed webhook
   */
  async sendPurchaseWebhook(merchantId: string, purchase: any) {
    await this.sendWebhook(merchantId, 'purchase.completed', {
      purchaseId: purchase.id,
      contentId: purchase.contentId,
      walletAddress: purchase.walletAddress,
      amount: purchase.payment?.amount?.toString(),
      currency: purchase.payment?.currency,
      purchasedAt: purchase.purchasedAt,
      expiresAt: purchase.expiresAt,
    });
  }

  /**
   * Send access expiring webhook (24 hours before expiration)
   */
  async sendAccessExpiringWebhook(merchantId: string, purchase: any) {
    await this.sendWebhook(merchantId, 'access.expiring', {
      purchaseId: purchase.id,
      contentId: purchase.contentId,
      walletAddress: purchase.walletAddress,
      expiresAt: purchase.expiresAt,
      hoursUntilExpiration: 24,
    });
  }

  /**
   * Send access expired webhook
   */
  async sendAccessExpiredWebhook(merchantId: string, purchase: any) {
    await this.sendWebhook(merchantId, 'access.expired', {
      purchaseId: purchase.id,
      contentId: purchase.contentId,
      walletAddress: purchase.walletAddress,
      expiredAt: purchase.expiresAt,
    });
  }

  /**
   * Send payment confirmed webhook
   */
  async sendPaymentConfirmedWebhook(merchantId: string, payment: any) {
    await this.sendWebhook(merchantId, 'payment.confirmed', {
      paymentId: payment.id,
      txSignature: payment.txSignature,
      amount: payment.amount?.toString(),
      currency: payment.currency,
      payerWallet: payment.payerWallet,
      confirmedAt: payment.confirmedAt,
    });
  }

  /**
   * Send follower added webhook
   */
  async sendFollowerAddedWebhook(merchantId: string, follower: any) {
    await this.sendWebhook(merchantId, 'merchant.follower.added', {
      followerWallet: follower.walletAddress,
      followedAt: follower.createdAt,
    });
  }

  private signPayload(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = this.signPayload(payload, secret);
    return signature === expected;
  }

  /**
   * Get webhook delivery logs for a merchant
   */
  async getWebhookLogs(merchantId: string, limit: number = 50) {
    // This would query a webhook_logs table if we add one
    // For now, we can query the queue jobs
    const jobs = await this.webhookQueue.getJobs(['completed', 'failed'], 0, limit);
    
    return jobs
      .filter((job) => job.data.merchantId === merchantId)
      .map((job) => ({
        event: job.data.event,
        status: job.finishedOn ? 'delivered' : 'failed',
        attempts: job.attemptsMade,
        createdAt: new Date(job.timestamp),
        completedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        error: job.failedReason,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

