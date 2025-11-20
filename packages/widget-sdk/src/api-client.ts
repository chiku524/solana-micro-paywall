import type { PaymentRequestConfig, PaymentRequestResponse, PaymentStatus, VerifyPaymentResponse } from './types.js';

const DEFAULT_API_URL = 'http://localhost:3000/api';

export class ApiClient {
  constructor(private apiUrl: string = DEFAULT_API_URL) {}

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async createPaymentRequest(config: PaymentRequestConfig): Promise<PaymentRequestResponse> {
    return this.request<PaymentRequestResponse>('/payments/create-payment-request', {
      method: 'POST',
      body: JSON.stringify({
        merchantId: config.merchantId,
        contentId: config.contentId,
        price: config.price,
        currency: config.currency,
        duration: config.duration,
      }),
    });
  }

  async verifyPayment(txSignature: string, merchantId: string, contentId: string): Promise<VerifyPaymentResponse> {
    return this.request<VerifyPaymentResponse>('/payments/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        txSignature,
        merchantId,
        contentId,
      }),
    });
  }

  async getPaymentStatus(txSignature: string): Promise<PaymentStatus> {
    return this.request<PaymentStatus>(`/payments/payment-status?tx=${encodeURIComponent(txSignature)}`);
  }

  async redeemToken(token: string): Promise<{ accessGranted: boolean; merchantId: string; contentId?: string; paymentId?: string }> {
    return this.request('/payments/redeem-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }
}

