const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      let errorDetails: any = null;
      
      try {
        const errorData = await response.json();
        // NestJS validation errors have a specific structure
        if (errorData.message) {
          if (Array.isArray(errorData.message)) {
            // Validation errors are arrays
            errorMessage = errorData.message.join(', ');
          } else {
            errorMessage = errorData.message;
          }
        }
        // Check for error property (some NestJS error formats)
        if (errorData.error) {
          errorMessage = `${errorData.error}: ${errorMessage}`;
        }
        errorDetails = errorData;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      
      const apiError: ApiError = {
        message: errorMessage,
        status: response.status,
        details: errorDetails,
      };
      throw apiError;
    }

    return response.json();
  }

  // Merchants
  async getMerchant(id: string) {
    return this.request(`/merchants/${id}`);
  }

  async getMerchants(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return this.request(`/merchants?${query.toString()}`);
  }

  async getMerchantDashboard(id: string) {
    return this.request(`/merchants/${id}/dashboard`);
  }

  async createMerchant(data: { email: string; payoutAddress?: string }) {
    return this.request('/merchants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMerchant(id: string, data: any) {
    return this.request(`/merchants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Contents
  async getContents(params?: { merchantId?: string; page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.merchantId) query.append('merchantId', params.merchantId);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    return this.request(`/contents?${query.toString()}`);
  }

  async getContent(id: string) {
    return this.request(`/contents/${id}`);
  }

  async getContentStats(id: string) {
    return this.request(`/contents/${id}/stats`);
  }

  async createContent(data: {
    merchantId: string;
    slug: string;
    priceLamports: number;
    currency?: string;
    durationSecs?: number;
    metadata?: any;
  }) {
    return this.request('/contents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContent(id: string, data: any) {
    return this.request(`/contents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContent(id: string) {
    return this.request(`/contents/${id}`, {
      method: 'DELETE',
    });
  }

  // Payments
  async getPaymentStatus(txSignature: string) {
    return this.request(`/payments/payment-status?tx=${encodeURIComponent(txSignature)}`);
  }

  async verifyPayment(data: { txSignature: string; merchantId: string; contentId: string }) {
    return this.request('/payments/verify-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();

