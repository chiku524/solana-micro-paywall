import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PaymentsService } from '../payments/payments.service';
import { SolanaService } from '../solana/solana.service';

@Processor('payment-verification')
export class PaymentVerificationProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentVerificationProcessor.name);

  constructor(
    @InjectQueue('payment-verification') private paymentQueue: Queue,
    private paymentsService: PaymentsService,
    private solanaService: SolanaService,
  ) {
    super();
  }

  async process(job: Job<{ txSignature: string; merchantId: string; contentId: string }>) {
    const { txSignature, merchantId, contentId } = job.data;

    this.logger.log(`Processing payment verification for ${txSignature}`);

    // Retry verification with exponential backoff
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tx = await this.solanaService.verifyTransaction(txSignature, {
          maxRetries: 3,
        });

        if (tx && !tx.meta?.err) {
          // Transaction confirmed, verify payment
          await this.paymentsService.verifyPayment({
            txSignature,
            merchantId,
            contentId,
          });
          this.logger.log(`Payment verified successfully: ${txSignature}`);
          return { success: true, txSignature };
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.log(`Retrying payment verification (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        this.logger.error(`Payment verification attempt ${attempt} failed`, error);
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }

    throw new Error('Payment verification failed after max retries');
  }
}

