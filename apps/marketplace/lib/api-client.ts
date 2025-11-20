import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Content {
  id: string;
  slug: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
  priceLamports: string;
  currency: string;
  durationSecs: number | null;
  visibility: string;
  previewText?: string;
  canonicalUrl?: string;
  viewCount: number;
  purchaseCount: number;
  createdAt: string;
  merchant: {
    id: string;
    email: string;
    payoutAddress?: string;
  };
  _count: {
    paymentIntents: number;
  };
}

export interface DiscoverResponse {
  contents: Content[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentRequestResponse {
  paymentIntentId: string;
  memo: string;
  solanaPayUrl: string;
  recipient: string;
  amount: string;
  currency: string;
}

export interface VerifyPaymentResponse {
  status: string;
  accessToken: string;
  paymentId: string;
}

class MarketplaceApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async discoverContents(params?: {
    category?: string;
    tags?: string[];
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    currency?: string;
    sort?: 'newest' | 'popular' | 'price_asc' | 'price_desc';
    page?: number;
    limit?: number;
  }): Promise<DiscoverResponse> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.tags) params.tags.forEach((tag) => query.append('tags', tag));
    if (params?.search) query.append('search', params.search);
    if (params?.minPrice !== undefined) query.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) query.append('maxPrice', params.maxPrice.toString());
    if (params?.currency) query.append('currency', params.currency);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const response = await this.client.get<DiscoverResponse>(`/discover/contents?${query.toString()}`);
    return response.data;
  }

  async getContentDetails(id: string): Promise<Content> {
    const response = await this.client.get<Content>(`/discover/contents/${id}`);
    return response.data;
  }

  async getMerchantContents(merchantId: string, params?: { page?: number; limit?: number }): Promise<DiscoverResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const response = await this.client.get<DiscoverResponse>(
      `/discover/merchants/${merchantId}/contents?${query.toString()}`,
    );
    return response.data;
  }

  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    const response = await this.client.get<Array<{ category: string; count: number }>>('/discover/categories');
    return response.data;
  }

  async getTrending(limit: number = 10): Promise<Content[]> {
    const response = await this.client.get<Content[]>(`/discover/trending?limit=${limit}`);
    return response.data;
  }

  async createPaymentRequest(merchantId: string, contentId: string): Promise<PaymentRequestResponse> {
    const response = await this.client.post<PaymentRequestResponse>('/payments/create-payment-request', {
      merchantId,
      contentId,
    });
    return response.data;
  }

  async verifyPayment(txSignature: string, merchantId: string, contentId: string): Promise<VerifyPaymentResponse> {
    const response = await this.client.post<VerifyPaymentResponse>('/payments/verify-payment', {
      txSignature,
      merchantId,
      contentId,
    });
    return response.data;
  }

  async getPaymentStatus(txSignature: string): Promise<{ status: string }> {
    const response = await this.client.get<{ status: string }>(`/payments/payment-status?tx=${txSignature}`);
    return response.data;
  }
}

export const marketplaceApi = new MarketplaceApiClient();

