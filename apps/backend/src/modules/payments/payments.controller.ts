import { Controller, Post, Get, Body, Query, Logger, ValidationPipe, UsePipes } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { TokensService } from '../tokens/tokens.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RedeemTokenDto } from './dto/redeem-token.dto';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly tokensService: TokensService,
  ) {}

  @Post('create-payment-request')
  @Throttle({ payment: { limit: 10, ttl: 60000 } }) // 10 requests per minute (payment tier)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPaymentRequest(@Body() dto: CreatePaymentRequestDto) {
    return this.paymentsService.createPaymentRequest(dto);
  }

  @Post('verify-payment')
  @Throttle({ payment: { limit: 20, ttl: 60000 } }) // 20 requests per minute (payment tier)
  @UsePipes(new ValidationPipe({ transform: true }))
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Get('payment-status')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  async getPaymentStatus(@Query('tx') txSignature: string) {
    if (!txSignature) {
      throw new Error('Transaction signature is required');
    }
    return this.paymentsService.getPaymentStatus(txSignature);
  }

  @Post('redeem-token')
  @UsePipes(new ValidationPipe({ transform: true }))
  async redeemToken(@Body() dto: RedeemTokenDto) {
    const result = await this.tokensService.redeemToken(dto.token);
    return {
      accessGranted: true,
      merchantId: result.merchantId,
      contentId: result.contentId,
      paymentId: result.paymentId,
    };
  }
}

