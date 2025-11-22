import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';
import { SolanaService } from '../solana/solana.service';
import { TokensService } from '../tokens/tokens.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly solana: SolanaService,
    private readonly tokensService: TokensService,
    private readonly webhooksService: WebhooksService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => AnalyticsService))
    private readonly analyticsService?: AnalyticsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Create a payment request/intent
   */
  async createPaymentRequest(dto: CreatePaymentRequestDto) {
    const { merchantId, contentId, price, currency, duration } = dto;

    // Fetch merchant with caching
    const merchantCacheKey = `merchant:${merchantId}`;
    let merchant: any = await this.cacheService.get(merchantCacheKey);
    
    if (!merchant) {
      merchant = await this.prisma.merchant.findUnique({
        where: { id: merchantId },
      });
      if (merchant) {
        await this.cacheService.set(merchantCacheKey, merchant, 300);
      }
    }

    if (!merchant) {
      throw new NotFoundException(`Merchant not found: ${merchantId}`);
    }

    if (merchant.status !== 'active') {
      throw new BadRequestException(`Merchant status is ${merchant.status}, must be active`);
    }

    // Fetch content with caching
    const contentCacheKey = `content:${contentId}`;
    let content: any = await this.cacheService.get(contentCacheKey);
    
    if (!content) {
      const contentData = await this.prisma.content.findFirst({
        where: { id: contentId, merchantId },
      });
      if (contentData) {
        content = {
          ...contentData,
          priceLamports: contentData.priceLamports.toString(),
        };
        await this.cacheService.set(contentCacheKey, content, 600);
      }
    }

    if (!content) {
      throw new NotFoundException(`Content not found: ${contentId} for merchant ${merchantId}`);
    }

    // Use provided price/duration or fall back to content defaults
    const finalPrice = price !== undefined ? BigInt(price) : BigInt(content.priceLamports);
    const finalCurrency = currency || content.currency;
    const finalDuration = duration || content.durationSecs || 86400; // Default 24 hours

    // Generate unique memo and nonce
    const memo = this.generateMemo(merchantId, contentId);
    const nonce = randomBytes(16).toString('hex');

    // Calculate expiration (15 minutes for payment intent)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const accessExpiresAt = new Date(Date.now() + finalDuration * 1000);

    // Get merchant payout address (required)
    const payoutAddress = merchant.payoutAddress;
    if (!payoutAddress) {
      throw new BadRequestException('Merchant must have a payout address configured');
    }

    if (!this.solana.isValidAddress(payoutAddress)) {
      throw new BadRequestException(`Invalid payout address: ${payoutAddress}`);
    }

    // Create payment intent
    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        merchantId,
        contentId,
        memo,
        nonce,
        amount: finalPrice,
        currency: finalCurrency,
        status: 'pending',
        expiresAt,
      },
      include: {
        merchant: true,
        content: true,
      },
    });

    // Generate Solana Pay URL
    const solanaPayUrl = this.generateSolanaPayUrl({
      recipient: payoutAddress,
      amount: Number(finalPrice) / 1e9, // Convert lamports to SOL (for display)
      label: content.slug || 'Payment',
      message: `Payment for ${content.slug}`,
      memo,
    });

    this.logger.log(`Created payment intent ${paymentIntent.id} for merchant ${merchantId}`);

    return {
      paymentIntentId: paymentIntent.id,
      memo,
      nonce,
      amount: paymentIntent.amount.toString(),
      currency: paymentIntent.currency,
      recipient: payoutAddress,
      solanaPayUrl,
      expiresAt: paymentIntent.expiresAt,
      accessExpiresAt,
    };
  }

  /**
   * Verify a payment transaction and issue access token
   */
  async verifyPayment(dto: VerifyPaymentDto) {
    const { txSignature, merchantId, contentId } = dto;

    // Verify transaction on-chain
    this.logger.log(`Verifying transaction ${txSignature}`);
    const tx = await this.solana.verifyTransaction(txSignature);

    if (!tx) {
      throw new BadRequestException(`Transaction not found or not yet confirmed: ${txSignature}`);
    }

    if (tx.meta?.err) {
      // Transaction failed
      throw new BadRequestException(`Transaction failed: ${JSON.stringify(tx.meta.err)}`);
    }

    // Extract memo from transaction to directly match payment intent
    const memo = this.solana.extractMemoFromTransaction(tx);
    
    let matchedIntent = null;
    
    if (memo) {
      // Direct lookup by memo (most efficient and secure)
      matchedIntent = await this.prisma.paymentIntent.findUnique({
        where: { memo },
        include: {
          merchant: true,
          content: true,
        },
      });

      // Validate that the intent matches the provided merchant/content
      if (matchedIntent) {
        if (matchedIntent.merchantId !== merchantId || matchedIntent.contentId !== contentId) {
          this.logger.warn(
            `Memo ${memo} matches intent but merchant/content mismatch. ` +
            `Expected: ${merchantId}/${contentId}, Got: ${matchedIntent.merchantId}/${matchedIntent.contentId}`
          );
          matchedIntent = null;
        } else if (matchedIntent.status !== 'pending') {
          this.logger.warn(`Payment intent ${matchedIntent.id} is not pending (status: ${matchedIntent.status})`);
          matchedIntent = null;
        } else if (matchedIntent.expiresAt < new Date()) {
          this.logger.warn(`Payment intent ${matchedIntent.id} has expired`);
          matchedIntent = null;
        }
      }
    }

    // Fallback: If memo extraction failed, use the old method (less secure)
    if (!matchedIntent) {
      this.logger.warn('Memo extraction failed or no match found, falling back to merchant/content lookup');
      const paymentIntents = await this.prisma.paymentIntent.findMany({
        where: {
          merchantId,
          contentId,
          status: 'pending',
          expiresAt: { gt: new Date() },
        },
        include: {
          merchant: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Try to match by recipient address and amount
      for (const intent of paymentIntents) {
        const accountKeys = 'message' in tx.transaction && 'accountKeys' in tx.transaction.message
          ? tx.transaction.message.accountKeys
          : [];
        const recipientPubkey = accountKeys.length > 0 ? accountKeys[0]?.toString() : null;
        if (recipientPubkey && intent.merchant.payoutAddress && recipientPubkey === intent.merchant.payoutAddress) {
          matchedIntent = intent;
          break;
        }
      }
    }

    if (!matchedIntent) {
      throw new NotFoundException('No matching payment intent found for this transaction');
    }

    // Check if payment already exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { txSignature },
    });

    if (existingPayment) {
      // Payment already verified, return existing access token
      const accessToken = await this.prisma.accessToken.findUnique({
        where: { paymentId: existingPayment.id },
      });

      if (accessToken && new Date(accessToken.expiresAt) > new Date()) {
        // Check if purchase record exists, create if not
        let purchase = await this.prisma.purchase.findUnique({
          where: { paymentId: existingPayment.id },
        });

        if (!purchase) {
          // Get content to determine expiration
          const content = await this.prisma.content.findUnique({
            where: { id: contentId },
          });

          const expiresAt = content?.durationSecs
            ? new Date(Date.now() + content.durationSecs * 1000)
            : null;

          purchase = await this.prisma.purchase.create({
            data: {
              walletAddress: existingPayment.payerWallet,
              paymentId: existingPayment.id,
              contentId,
              merchantId,
              accessTokenId: accessToken.id,
              expiresAt,
            },
          });
        }

        return {
          status: 'confirmed',
          accessToken: await this.tokensService.issueToken(accessToken.tokenJti),
          paymentId: existingPayment.id,
        };
      }
    }

    // Extract payment details from transaction
    // Handle both TransactionResponse and VersionedTransactionResponse
    const accountKeys = 'message' in tx.transaction && 'accountKeys' in tx.transaction.message
      ? tx.transaction.message.accountKeys
      : [];
    const payerWallet = accountKeys.length > 0 ? accountKeys[0]?.toString() || 'unknown' : 'unknown';
    const blockTime = tx.blockTime ? BigInt(tx.blockTime) : null;
    const slot = tx.slot ? BigInt(tx.slot) : null;

    // Create payment record
    const payment = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update payment intent
      const updatedIntent = await tx.paymentIntent.update({
        where: { id: matchedIntent.id },
        data: {
          status: 'confirmed',
          confirmedAt: new Date(),
        },
      });

      // Create payment
      const newPayment = await tx.payment.create({
        data: {
          intentId: updatedIntent.id,
          txSignature,
          payerWallet,
          amount: updatedIntent.amount,
          currency: updatedIntent.currency,
          blockTime,
          slot,
        },
      });

      // Get content to determine expiration
      const content = await tx.content.findUnique({
        where: { id: contentId },
      });

      // Calculate expiration time
      const expiresAt = content?.durationSecs
        ? new Date(Date.now() + content.durationSecs * 1000)
        : null;

      // Issue access token
      const accessToken = await this.tokensService.createAccessToken({
        merchantId,
        contentId,
        paymentId: newPayment.id,
        expiresAt: expiresAt || new Date(Date.now() + 86400 * 1000), // Default 24 hours if no duration
      });

      // Link payment to access token
      await tx.accessToken.update({
        where: { id: accessToken.id },
        data: { paymentId: newPayment.id },
      });

      // Create Purchase record linked to wallet address
      const purchase = await tx.purchase.create({
        data: {
          walletAddress: payerWallet,
          paymentId: newPayment.id,
          contentId,
          merchantId,
          accessTokenId: accessToken.id,
          expiresAt,
        },
      });

      return { payment: newPayment, accessToken, purchase };
    });

    this.logger.log(`Payment verified and access token issued for transaction ${txSignature}`);

    // Send webhook notifications
    try {
      // Send payment confirmed webhook
      await this.webhooksService.sendPaymentConfirmedWebhook(merchantId, payment.payment);
      
      // Send purchase completed webhook
      await this.webhooksService.sendPurchaseWebhook(merchantId, payment.purchase);
    } catch (error) {
      this.logger.warn('Failed to send webhook notification', error);
    }

    // Track analytics (async, don't wait)
    if (this.analyticsService) {
      this.analyticsService.trackPurchase(payment.purchase).catch((err) => {
        this.logger.warn('Failed to track purchase analytics', err);
      });
    }

    // Send email notifications (async, don't wait)
    if (this.notificationsService) {
      // Notify buyer (if email available, would need to fetch from wallet or user profile)
      this.notificationsService.sendPurchaseNotification(
        { walletAddress: payment.purchase.walletAddress },
        payment.purchase,
      ).catch((err) => {
        this.logger.debug('Failed to send purchase notification to buyer', err);
      });

      // Notify merchant
      this.notificationsService.sendMerchantPaymentNotification(
        merchantId,
        payment.payment,
      ).catch((err) => {
        this.logger.warn('Failed to send payment notification to merchant', err);
      });
    }

    return {
      status: 'confirmed',
      accessToken: await this.tokensService.issueToken(payment.accessToken.tokenJti),
      paymentId: payment.payment.id,
    };
  }

  /**
   * Get payment status by transaction signature
   */
  async getPaymentStatus(txSignature: string) {
    const cacheKey = `payment:status:${txSignature}`;
    
    // Try cache first (1 minute TTL for frequently changing data)
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { txSignature },
      include: {
        intent: true,
      },
    });

    let result;
    if (!payment) {
      // Check if transaction exists on-chain but not in our DB
      const tx = await this.solana.verifyTransaction(txSignature);
      if (tx) {
        result = { status: 'pending', txSignature };
      } else {
        result = { status: 'not_found', txSignature };
      }
    } else {
      result = {
        status: payment.intent.status,
        txSignature: payment.txSignature,
        confirmedAt: payment.confirmedAt,
      };
    }

    // Cache for 1 minute
    await this.cacheService.set(cacheKey, result, 60);
    return result;
  }

  /**
   * Generate a unique memo for payment tracking
   */
  private generateMemo(merchantId: string, contentId: string): string {
    const timestamp = Date.now();
    const random = randomBytes(8).toString('hex');
    return `PAY:${merchantId.slice(0, 8)}:${contentId.slice(0, 8)}:${timestamp}:${random}`;
  }

  /**
   * Generate Solana Pay URL
   */
  private generateSolanaPayUrl(params: {
    recipient: string;
    amount: number;
    label: string;
    message: string;
    memo: string;
  }): string {
    const { recipient, amount, label, message, memo } = params;
    const baseUrl = 'https://solana.com/pay';
    const query = new URLSearchParams({
      recipient,
      amount: amount.toString(),
      label,
      message,
      memo,
    });
    return `${baseUrl}?${query.toString()}`;
  }

  /**
   * Cleanup expired payment intents
   */
  async cleanupExpiredIntents(): Promise<number> {
    const result = await this.prisma.paymentIntent.updateMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    this.logger.log(`Marked ${result.count} expired payment intents`);
    return result.count;
  }
}

