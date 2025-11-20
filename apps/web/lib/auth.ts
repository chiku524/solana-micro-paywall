/**
 * Authentication utilities for JWT token management
 */

const TOKEN_KEY = 'auth_token';
const MERCHANT_KEY = 'merchant_id';

export interface AuthToken {
  accessToken: string;
  merchant: {
    id: string;
    email: string;
    status: string;
  };
}

/**
 * Store authentication token
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Remove authentication token
 */
export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MERCHANT_KEY);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader(): { Authorization: string } | {} {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

/**
 * Store merchant ID (for backward compatibility)
 */
export function setMerchantId(merchantId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MERCHANT_KEY, merchantId);
  }
}

/**
 * Get merchant ID
 */
export function getMerchantId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(MERCHANT_KEY);
  }
  return null;
}

