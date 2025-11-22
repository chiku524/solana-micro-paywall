export interface PaymentRequestConfig {
  merchantId: string;
  contentId: string;
  price?: number; // Override content price (in lamports)
  currency?: 'SOL' | 'USDC' | 'PYUSD';
  duration?: number; // Override content duration (in seconds)
  apiUrl?: string; // Backend API URL
}

export interface PaymentRequestResponse {
  paymentIntentId: string;
  memo: string;
  nonce: string;
  amount: string;
  currency: string;
  recipient: string;
  solanaPayUrl: string;
  expiresAt: string;
  accessExpiresAt: string;
}

export interface PaymentStatus {
  status: 'pending' | 'confirmed' | 'failed' | 'not_found';
  txSignature?: string;
  confirmedAt?: string;
}

export interface VerifyPaymentResponse {
  status: 'confirmed';
  accessToken: string;
  paymentId: string;
}

export interface WidgetConfig {
  apiUrl?: string;
  theme?: 'light' | 'dark' | 'auto';
  buttonText?: string;
  buttonClass?: string;
  // Enhanced customization
  colors?: {
    primary?: string; // Primary button color (e.g., '#10b981')
    primaryHover?: string; // Hover state color
    text?: string; // Text color
    background?: string; // Background color
    border?: string; // Border color
  };
  logo?: {
    url?: string; // Logo image URL
    alt?: string; // Alt text
    width?: number; // Logo width in pixels
    height?: number; // Logo height in pixels
  };
  ctaText?: string; // Custom CTA text (e.g., "Unlock Now", "Get Access")
  showPrice?: boolean; // Show/hide price
  showDuration?: boolean; // Show/hide access duration
  borderRadius?: number; // Border radius in pixels
  fontFamily?: string; // Custom font family
  onPaymentSuccess?: (token: string) => void;
  onPaymentError?: (error: Error) => void;
}

export type PaymentEvent = 
  | { type: 'payment_requested'; paymentIntentId: string }
  | { type: 'payment_pending'; txSignature: string }
  | { type: 'payment_confirmed'; token: string; paymentId: string }
  | { type: 'payment_failed'; error: string }
  | { type: 'payment_expired' };

