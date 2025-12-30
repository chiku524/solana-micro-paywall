'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from './api';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  merchantId: string | null;
  merchant: any | null;
  login: (token: string, merchantId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedMerchantId = localStorage.getItem('merchantId');

      if (storedToken && storedMerchantId) {
        setToken(storedToken);
        setMerchantId(storedMerchantId);
        
        // Validate token by fetching merchant info
        validateToken(storedToken, storedMerchantId);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const validateToken = async (authToken: string, authMerchantId: string) => {
    try {
      // Use /me endpoint for authenticated merchant data
      const merchantData = await apiGet<any>('/api/merchants/me', authToken);
      setMerchant(merchantData);
      setIsLoading(false);
    } catch (error: any) {
      // Token is invalid or expired - silently handle it
      if (error?.status === 401) {
        // Only logout if it's an auth error, don't log to console
        logout();
      } else {
        // For other errors, still set loading to false
        setIsLoading(false);
      }
    }
  };

  const login = useCallback((authToken: string, authMerchantId: string) => {
    setToken(authToken);
    setMerchantId(authMerchantId);
    localStorage.setItem('token', authToken);
    localStorage.setItem('merchantId', authMerchantId);
    
    // Fetch merchant data
    validateToken(authToken, authMerchantId);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setMerchantId(null);
    setMerchant(null);
    localStorage.removeItem('token');
    localStorage.removeItem('merchantId');
    router.push('/');
  }, [router]);

  const value: AuthContextType = {
    isAuthenticated: !!token && !!merchantId,
    token,
    merchantId,
    merchant,
    login,
    logout,
    isLoading,
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

