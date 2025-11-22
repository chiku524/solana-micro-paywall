import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebhooksService } from '../webhooks/webhooks.service';

@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly webhooksService: WebhooksService) {
    super();
  }

  async process(job: Job<{
    merchantId: string;
    webhookUrl: string;
    event: string;
    payload: any;
    signature: string;
    secret: string;
  }>) {
    const { merchantId, webhookUrl, event } = job.data;

    this.logger.log(`Processing webhook delivery for merchant ${merchantId}, event: ${event}`);

    try {
      const result = await this.webhooksService.deliverWebhook(job.data);
      this.logger.log(`Webhook delivered successfully: ${event} to ${webhookUrl}`);
      return result;
    } catch (error) {
      this.logger.error(`Webhook delivery failed (attempt ${job.attemptsMade}/${job.opts.attempts}): ${event}`, error);
      throw error; // Re-throw to trigger retry
    }
  }
}

