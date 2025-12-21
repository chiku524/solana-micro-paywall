// Shared types between frontend and backend

export type MerchantStatus = 'pending' | 'active' | 'suspended';
export type ContentVisibility = 'public' | 'private';
export type PaymentIntentStatus = 'pending' | 'confirmed' | 'failed' | 'expired' | 'refunded';

export interface Merchant {
  id: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  payoutAddress?: string;
  webhookSecret?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
  githubUrl?: string;
  status: MerchantStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Content {
  id: string;
  merchantId: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string;
  thumbnailUrl?: string;
  priceLamports: number;
  currency: string;
  durationSeconds?: number;
  visibility: ContentVisibility;
  previewText?: string;
  canonicalUrl?: string;
  viewCount: number;
  purchaseCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface PaymentIntent {
  id: string;
  merchantId: string;
  contentId: string;
  amountLamports: number;
  currency: string;
  nonce: string;
  memo?: string;
  payerAddress?: string;
  transactionSignature?: string;
  status: PaymentIntentStatus;
  expiresAt: number;
  confirmedAt?: number;
  createdAt: number;
}

export interface Purchase {
  id: string;
  paymentIntentId: string;
  merchantId: string;
  contentId: string;
  payerAddress: string;
  amountLamports: number;
  currency: string;
  transactionSignature: string;
  accessToken: string;
  expiresAt?: number;
  confirmedAt: number;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  walletAddress: string;
  contentId: string;
  createdAt: number;
}

// API Request/Response types
export interface CreateMerchantRequest {
  email: string;
  payoutAddress?: string;
}

export interface UpdateMerchantRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  payoutAddress?: string;
  webhookSecret?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
  githubUrl?: string;
}

export interface CreateContentRequest {
  slug: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string;
  thumbnailUrl?: string;
  priceLamports: number;
  currency?: string;
  durationSeconds?: number;
  visibility?: ContentVisibility;
  previewText?: string;
  canonicalUrl?: string;
}

export interface UpdateContentRequest extends Partial<CreateContentRequest> {
  id: string;
}

export interface CreatePaymentRequestRequest {
  contentId: string;
}

export interface VerifyPaymentRequest {
  paymentIntentId: string;
  transactionSignature: string;
}

export interface LoginRequest {
  merchantId: string;
}

export interface LoginResponse {
  token: string;
  merchant: Merchant;
}

export interface PaymentRequestResponse {
  paymentIntent: PaymentIntent;
  paymentUrl: string;
  qrCode?: string;
  recipientAddress?: string; // Merchant payout address
}

export interface VerifyPaymentResponse {
  purchase: Purchase;
  accessToken: string;
}

export interface AccessCheckResponse {
  hasAccess: boolean;
  purchase?: Purchase;
  expiresAt?: number;
}

// Analytics types
export interface PaymentStats {
  totalPayments: number;
  todayPayments: number;
  weekPayments: number;
  monthPayments: number;
  totalRevenueLamports: number;
  averagePaymentLamports: number;
}

export interface RecentPayment {
  id: string;
  transactionSignature: string;
  contentTitle: string;
  amountLamports: number;
  payerAddress: string;
  confirmedAt: number;
}

// Discovery types
export interface DiscoverContentParams {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string;
  sort?: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'trending';
  search?: string;
}

export interface DiscoverContentResponse {
  content: Content[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error types
export interface ApiError {
  error: string;
  message: string;
  code?: string;
}
