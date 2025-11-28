// Ensure API_URL ends with /api
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return url.endsWith('/api') ? url : `${url}/api`;
};
const API_URL = getApiUrl();
import { getAuthHeader } from './auth';

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

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

export class ApiClient {
  private baseUrl: string;
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private getRequestKey(endpoint: string, options?: RequestInit): string {
    return `${options?.method || 'GET'}:${endpoint}:${JSON.stringify(options?.body || '')}`;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async requestWithTimeout<T>(
    url: string,
    options?: RequestInit,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Get auth header (JWT token)
      const authHeaders = getAuthHeader();
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders, // Add JWT token if available
          ...options?.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options?: RequestInit,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.requestWithTimeout(url, options);

        if (!response.ok) {
          let errorMessage = response.statusText;
          let errorDetails: any = null;
          
          try {
            const errorData = await response.json();
            if (errorData.message) {
              if (Array.isArray(errorData.message)) {
                errorMessage = errorData.message.join(', ');
              } else {
                errorMessage = errorData.message;
              }
            }
            if (errorData.error) {
              errorMessage = `${errorData.error}: ${errorMessage}`;
            }
            errorDetails = errorData;
          } catch {
            errorMessage = response.statusText || `HTTP ${response.status}`;
          }
          
          // Don't retry on 4xx errors (client errors)
          if (response.status >= 400 && response.status < 500) {
            const apiError: ApiError = {
              message: errorMessage,
              status: response.status,
              details: errorDetails,
            };
            throw apiError;
          }

          // Retry on 5xx errors (server errors) and network errors
          lastError = {
            message: errorMessage,
            status: response.status,
            details: errorDetails,
          };
          
          if (attempt < retries) {
            await this.sleep(this.RETRY_DELAY * (attempt + 1)); // Exponential backoff
            continue;
          }
          
          const apiError: ApiError = {
            message: errorMessage,
            status: response.status,
            details: errorDetails,
          };
          throw apiError;
        }

        return response.json();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on timeout or abort errors
        if (error.message === 'Request timeout' || error.name === 'AbortError') {
          throw error;
        }

        // Retry on network errors
        if (attempt < retries && (error instanceof TypeError || !error.status)) {
          await this.sleep(this.RETRY_DELAY * (attempt + 1));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const requestKey = this.getRequestKey(endpoint, options);
    
    // Check if there's already a pending request for this endpoint
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request
    const requestPromise = this.requestWithRetry<T>(endpoint, options);
    
    // Store pending request
    this.pendingRequests.set(requestKey, requestPromise);
    
    // Clean up after request completes
    requestPromise.finally(() => {
      this.pendingRequests.delete(requestKey);
    });

    return requestPromise;
  }

  // Auth
  async login(merchantId: string) {
    return this.request<{ accessToken: string; merchant: { id: string; email: string; status: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ merchantId }),
    });
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

  async getMerchantPublicProfile(id: string) {
    return this.request(`/merchants/${id}/public-profile`);
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
  async getContents(params?: { merchantId?: string; page?: number; limit?: number; search?: string; category?: string; visibility?: string }) {
    const query = new URLSearchParams();
    if (params?.merchantId) query.append('merchantId', params.merchantId);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.visibility) query.append('visibility', params.visibility);
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

  // Discover (Marketplace)
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

    return this.request<DiscoverResponse>(`/discover/contents?${query.toString()}`);
  }

  async getContentDetails(id: string): Promise<Content> {
    return this.request<Content>(`/discover/contents/${id}`);
  }

  async getMerchantContents(merchantId: string, params?: { page?: number; limit?: number }): Promise<DiscoverResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    return this.request<DiscoverResponse>(`/discover/merchants/${merchantId}/contents?${query.toString()}`);
  }

  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    return this.request<Array<{ category: string; count: number }>>('/discover/categories');
  }

  async getTrending(limit: number = 10): Promise<Content[]> {
    return this.request<Content[]>(`/discover/trending?limit=${limit}`);
  }

  // Payments
  async getPaymentStatus(txSignature: string) {
    return this.request(`/payments/payment-status?tx=${encodeURIComponent(txSignature)}`);
  }

  async createPaymentRequest(data: { merchantId: string; contentId: string; price?: number; currency?: string; duration?: number }): Promise<PaymentRequestResponse> {
    return this.request<PaymentRequestResponse>('/payments/create-payment-request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyPayment(data: { txSignature: string; merchantId: string; contentId: string }): Promise<VerifyPaymentResponse> {
    return this.request<VerifyPaymentResponse>('/payments/verify-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Purchases
  async getPurchases(walletAddress: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    query.append('walletAddress', walletAddress);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return this.request(`/purchases?${query.toString()}`);
  }

  async checkAccess(walletAddress: string, merchantId: string, contentSlug: string) {
    const query = new URLSearchParams();
    query.append('walletAddress', walletAddress);
    query.append('merchantId', merchantId);
    query.append('contentSlug', contentSlug);
    return this.request<{ hasAccess: boolean }>(`/purchases/check-access?${query.toString()}`);
  }

  async generateShareableLink(purchaseId: string, walletAddress: string) {
    return this.request<{ shareableLink: string; shareToken: string }>(
      `/purchases/${purchaseId}/shareable-link?walletAddress=${walletAddress}`
    );
  }

  async verifyShareableAccess(purchaseId: string, token: string) {
    return this.request<{ hasAccess: boolean; purchase?: any }>(
      `/purchases/share/${purchaseId}/verify?token=${token}`
    );
  }

  // Bookmarks
  async getBookmarks(walletAddress: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    query.append('walletAddress', walletAddress);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return this.request(`/bookmarks?${query.toString()}`);
  }

  async addBookmark(walletAddress: string, contentId: string) {
    return this.request('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, contentId }),
    });
  }

  async removeBookmark(walletAddress: string, contentId: string) {
    const query = new URLSearchParams();
    query.append('walletAddress', walletAddress);
    return this.request(`/bookmarks/${contentId}?${query.toString()}`, {
      method: 'DELETE',
    });
  }

  async isBookmarked(walletAddress: string, contentId: string) {
    const query = new URLSearchParams();
    query.append('walletAddress', walletAddress);
    query.append('contentId', contentId);
    return this.request<{ isBookmarked: boolean }>(`/bookmarks/check?${query.toString()}`);
  }

  // Recommendations
  async getRecommendationsForWallet(walletAddress: string, limit?: number) {
    const query = new URLSearchParams();
    query.append('walletAddress', walletAddress);
    if (limit) query.append('limit', limit.toString());
    return this.request<Content[]>(`/recommendations/for-wallet?${query.toString()}`);
  }

  async getRecommendationsForContent(contentId: string, limit?: number) {
    const query = new URLSearchParams();
    if (limit) query.append('limit', limit.toString());
    return this.request<Content[]>(`/recommendations/for-content/${contentId}?${query.toString()}`);
  }

  // Merchant Following
  async followMerchant(walletAddress: string, merchantId: string) {
    return this.request(`/merchants/${merchantId}/follow`, {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async unfollowMerchant(walletAddress: string, merchantId: string) {
    return this.request(`/merchants/${merchantId}/unfollow`, {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async getFollowStatus(walletAddress: string, merchantId: string) {
    const query = new URLSearchParams();
    query.append('walletAddress', walletAddress);
    return this.request<{ isFollowing: boolean; followerCount: number }>(
      `/merchants/${merchantId}/follow-status?${query.toString()}`
    );
  }

  // Analytics
  async exportPayments(merchantId: string, params?: { startDate?: string; endDate?: string }): Promise<Blob> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    
    const authHeaders = getAuthHeader();
    
    const response = await fetch(
      `${this.baseUrl}/analytics/export/${merchantId}?${query.toString()}`,
      {
        headers: {
          ...authHeaders,
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export failed: ${response.statusText} - ${errorText}`);
    }
    
    return response.blob();
  }

  // Referrals
  async createReferralCode(data: {
    merchantId?: string;
    referrerWallet?: string;
    discountPercent?: number;
    discountAmount?: string;
    maxUses?: number;
    expiresAt?: string;
    customCode?: string;
  }) {
    return this.request('/referrals/codes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReferralCode(code: string) {
    return this.request(`/referrals/codes/${code}`);
  }

  async applyReferralCode(data: {
    code: string;
    referrerWallet: string;
    refereeWallet: string;
    purchaseId: string;
    originalAmount: string;
  }) {
    return this.request('/referrals/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReferralStats(walletAddress: string) {
    return this.request(`/referrals/stats/${walletAddress}`);
  }

  // API Keys
  async createApiKey(data: {
    name: string;
    rateLimit?: number;
    allowedIps?: string[];
    expiresAt?: string;
  }) {
    return this.request('/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listApiKeys() {
    return this.request('/api-keys');
  }

  async revokeApiKey(apiKeyId: string) {
    return this.request(`/api-keys/${apiKeyId}`, {
      method: 'DELETE',
    });
  }

  async getApiKeyStats(apiKeyId?: string, days?: number) {
    const query = new URLSearchParams();
    if (apiKeyId) query.append('apiKeyId', apiKeyId);
    if (days) query.append('days', days.toString());
    return this.request(`/api-keys/stats?${query.toString()}`);
  }

  // Analytics
  async getConversionRate(merchantId: string, days?: number) {
    const query = new URLSearchParams();
    if (days) query.append('days', days.toString());
    return this.request(`/analytics/conversion/${merchantId}?${query.toString()}`);
  }

  async getTopContent(merchantId?: string, limit?: number) {
    const query = new URLSearchParams();
    if (merchantId) query.append('merchantId', merchantId);
    if (limit) query.append('limit', limit.toString());
    return this.request(`/analytics/top-content?${query.toString()}`);
  }

  async getMerchantPerformance(merchantId: string, days?: number) {
    const query = new URLSearchParams();
    if (days) query.append('days', days.toString());
    return this.request(`/analytics/performance/${merchantId}?${query.toString()}`);
  }

}

export const apiClient = new ApiClient();

// SWR fetcher function
export const swrFetcher = async (endpoint: string) => {
  // Remove /api prefix if present since apiClient already adds it
  const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.replace('/api', '') : endpoint;
  // Remove leading slash if present
  const finalEndpoint = cleanEndpoint.startsWith('/') ? cleanEndpoint.slice(1) : cleanEndpoint;
  return apiClient.request(finalEndpoint);
};

