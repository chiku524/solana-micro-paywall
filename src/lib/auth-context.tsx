'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from './api';
import { showToast } from './toast';

import type { Merchant } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  merchantId: string | null;
  merchant: Merchant | null;
  login: (token: string, refreshToken: string, merchantId: string) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedMerchantId = localStorage.getItem('merchantId');

      if (storedToken && storedMerchantId) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setMerchantId(storedMerchantId);
        
        // Validate token by fetching merchant info
        validateToken(storedToken, storedMerchantId);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // Auto-refresh token before expiration (refresh 5 minutes before expiry)
  useEffect(() => {
    if (!token || !refreshToken) return;

    // Decode token to get expiration (simple base64 decode, not full JWT verification)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expirationTime - now;
      const refreshTime = timeUntilExpiry - (5 * 60 * 1000); // 5 minutes before expiry

      if (refreshTime > 0) {
        const timeout = setTimeout(() => {
          refreshAccessToken();
        }, refreshTime);

        return () => clearTimeout(timeout);
      } else {
        // Token expires soon, refresh immediately
        refreshAccessToken();
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }, [token, refreshToken]);

  const validateToken = async (authToken: string, authMerchantId: string) => {
    try {
      // Use /me endpoint for authenticated merchant data
      const merchantData = await apiGet<Merchant>('/api/merchants/me', authToken);
      setMerchant(merchantData);
      setIsLoading(false);
    } catch (error: any) {
      // Token is invalid or expired - try to refresh
      if (error?.status === 401 && refreshToken) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          logout();
        }
      } else if (error?.status === 401) {
        // No refresh token, logout
        logout();
      } else {
        // For other errors, still set loading to false
        setIsLoading(false);
      }
    }
  };

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    if (!refreshToken || isRefreshing) return false;

    setIsRefreshing(true);
    try {
      const { apiPost } = await import('./api');
      const response = await apiPost<{ token: string; merchant: Merchant }>(
        '/api/auth/refresh',
        { refreshToken }
      );

      setToken(response.token);
      localStorage.setItem('token', response.token);
      setMerchant(response.merchant);
      setIsRefreshing(false);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      setIsRefreshing(false);
      logout();
      return false;
    }
  }, [refreshToken, isRefreshing]);

  const login = useCallback((authToken: string, authRefreshToken: string, authMerchantId: string) => {
    setToken(authToken);
    setRefreshToken(authRefreshToken);
    setMerchantId(authMerchantId);
    localStorage.setItem('token', authToken);
    if (authRefreshToken) {
      localStorage.setItem('refreshToken', authRefreshToken);
    }
    localStorage.setItem('merchantId', authMerchantId);
    
    // Fetch merchant data
    validateToken(authToken, authMerchantId);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setMerchantId(null);
    setMerchant(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('merchantId');
    router.push('/');
  }, [router]);

  const value: AuthContextType = {
    isAuthenticated: !!token && !!merchantId,
    token,
    refreshToken,
    merchantId,
    merchant,
    login,
    logout,
    refreshAccessToken,
    isLoading: isLoading || isRefreshing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

