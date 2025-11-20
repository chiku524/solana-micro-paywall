import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createHmac } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async sendWebhook(merchantId: string, event: string, data: any) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { webhookSecret: true, configJson: true },
    });

    if (!merchant?.webhookSecret) {
      return; // No webhook configured
    }

    const webhookUrl = (merchant.configJson as any)?.webhookUrl;
    if (!webhookUrl) {
      return;
    }

    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const signature = this.signPayload(JSON.stringify(payload), merchant.webhookSecret);

    try {
      await firstValueFrom(
        this.httpService.post(
          webhookUrl,
          payload,
          {
            headers: {
              'X-Webhook-Signature': signature,
              'X-Webhook-Event': event,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          },
        ),
      );
      this.logger.log(`Webhook sent successfully for merchant ${merchantId}, event: ${event}`);
    } catch (error) {
      this.logger.error(`Webhook delivery failed for merchant ${merchantId}, event: ${event}`, error);
      // TODO: Queue for retry
    }
  }

  private signPayload(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = this.signPayload(payload, secret);
    return signature === expected;
  }
}

