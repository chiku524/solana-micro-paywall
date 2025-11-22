import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export type NotificationType =
  | 'purchase.completed'
  | 'payment.confirmed'
  | 'access.expiring'
  | 'access.expired'
  | 'content.published'
  | 'follower.added'
  | 'refund.processed';

export interface NotificationRecipient {
  email?: string;
  walletAddress?: string;
  merchantId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly emailEnabled: boolean;
  private readonly emailProvider: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Check if email is enabled
    this.emailEnabled = this.configService.get<string>('EMAIL_ENABLED') === 'true';
    this.emailProvider = this.configService.get<string>('EMAIL_PROVIDER') || 'sendgrid';
  }

  /**
   * Send email notification
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
  ): Promise<boolean> {
    if (!this.emailEnabled) {
      this.logger.debug('Email notifications are disabled');
      return false;
    }

    try {
      if (this.emailProvider === 'sendgrid') {
        return this.sendViaSendGrid(to, subject, htmlBody, textBody);
      } else if (this.emailProvider === 'ses') {
        return this.sendViaSES(to, subject, htmlBody, textBody);
      } else {
        this.logger.warn(`Unknown email provider: ${this.emailProvider}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      return false;
    }
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
  ): Promise<boolean> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      this.logger.warn('SendGrid API key not configured');
      return false;
    }

    const fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@solana-paywall.com';
    const fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'Solana Micro-Paywall';

    try {
      await firstValueFrom(
        this.httpService.post(
          'https://api.sendgrid.com/v3/mail/send',
          {
            personalizations: [
              {
                to: [{ email: to }],
                subject,
              },
            ],
            from: {
              email: fromEmail,
              name: fromName,
            },
            content: [
              {
                type: 'text/html',
                value: htmlBody,
              },
              ...(textBody
                ? [
                    {
                      type: 'text/plain',
                      value: textBody,
                    },
                  ]
                : []),
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        ),
      );

      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`SendGrid error: ${error.response?.data || error.message}`);
      return false;
    }
  }

  /**
   * Send via AWS SES
   */
  private async sendViaSES(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
  ): Promise<boolean> {
    // AWS SES implementation would go here
    // For now, just log that it's not implemented
    this.logger.warn('AWS SES email provider not yet implemented');
    return false;
  }

  /**
   * Send purchase completed notification to buyer
   */
  async sendPurchaseNotification(recipient: NotificationRecipient, purchase: any) {
    if (!recipient.email && !recipient.walletAddress) {
      return;
    }

    const subject = 'Purchase Confirmed - Solana Micro-Paywall';
    const htmlBody = `
      <h2>Purchase Confirmed!</h2>
      <p>Your purchase has been confirmed.</p>
      <ul>
        <li><strong>Content:</strong> ${purchase.content?.title || purchase.content?.slug || 'N/A'}</li>
        <li><strong>Amount:</strong> ${(Number(purchase.payment?.amount || 0) / 1e9).toFixed(4)} ${purchase.payment?.currency || 'SOL'}</li>
        <li><strong>Transaction:</strong> ${purchase.payment?.txSignature || 'N/A'}</li>
        <li><strong>Purchase Date:</strong> ${new Date(purchase.purchasedAt).toLocaleString()}</li>
        ${purchase.expiresAt ? `<li><strong>Expires:</strong> ${new Date(purchase.expiresAt).toLocaleString()}</li>` : ''}
      </ul>
      <p>You now have access to this content!</p>
    `;

    if (recipient.email) {
      await this.sendEmail(recipient.email, subject, htmlBody);
    }
  }

  /**
   * Send payment confirmed notification to merchant
   */
  async sendMerchantPaymentNotification(merchantId: string, payment: any) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { email: true },
    });

    if (!merchant?.email) {
      return;
    }

    const subject = 'New Payment Received - Solana Micro-Paywall';
    const htmlBody = `
      <h2>New Payment Received!</h2>
      <p>You've received a new payment.</p>
      <ul>
        <li><strong>Amount:</strong> ${(Number(payment.amount || 0) / 1e9).toFixed(4)} ${payment.currency || 'SOL'}</li>
        <li><strong>From:</strong> ${payment.payerWallet || 'N/A'}</li>
        <li><strong>Transaction:</strong> ${payment.txSignature || 'N/A'}</li>
        <li><strong>Date:</strong> ${new Date(payment.confirmedAt).toLocaleString()}</li>
      </ul>
    `;

    await this.sendEmail(merchant.email, subject, htmlBody);
  }

  /**
   * Send access expiring notification
   */
  async sendAccessExpiringNotification(recipient: NotificationRecipient, purchase: any, hoursUntilExpiration: number) {
    if (!recipient.email && !recipient.walletAddress) {
      return;
    }

    const subject = 'Access Expiring Soon - Solana Micro-Paywall';
    const htmlBody = `
      <h2>Your Access is Expiring Soon</h2>
      <p>Your access to the following content will expire in ${hoursUntilExpiration} hours:</p>
      <ul>
        <li><strong>Content:</strong> ${purchase.content?.title || purchase.content?.slug || 'N/A'}</li>
        <li><strong>Expires:</strong> ${purchase.expiresAt ? new Date(purchase.expiresAt).toLocaleString() : 'N/A'}</li>
      </ul>
      <p>Make sure to use your access before it expires!</p>
    `;

    if (recipient.email) {
      await this.sendEmail(recipient.email, subject, htmlBody);
    }
  }

  /**
   * Send follower added notification to merchant
   */
  async sendFollowerNotification(merchantId: string, followerWallet: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { email: true },
    });

    if (!merchant?.email) {
      return;
    }

    const subject = 'New Follower - Solana Micro-Paywall';
    const htmlBody = `
      <h2>You Have a New Follower!</h2>
      <p>${followerWallet} has started following you.</p>
      <p>Keep creating great content to engage your audience!</p>
    `;

    await this.sendEmail(merchant.email, subject, htmlBody);
  }
}

