'use client';

import { SWRConfig } from 'swr';
import { apiGet } from './api';
import { showToast } from './toast';

// Global SWR fetcher that uses our API client
const fetcher = async <T,>(url: string | [string, string?]): Promise<T> => {
  // Handle array keys (for authenticated requests)
  if (Array.isArray(url)) {
    const [endpoint, token] = url;
    return apiGet<T>(endpoint, token);
  }
  // Handle string keys (for unauthenticated requests)
  return apiGet<T>(url);
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false, // Don't refetch on window focus
        revalidateOnReconnect: true, // Refetch when network reconnects
        dedupingInterval: 2000, // Dedupe requests within 2 seconds
        focusThrottleInterval: 5000, // Throttle focus revalidation
        errorRetryCount: 3, // Retry failed requests 3 times
        errorRetryInterval: 5000, // Wait 5 seconds between retries
        shouldRetryOnError: (error) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry on 5xx errors and network errors
          return true;
        },
        onError: (error, key) => {
          // Show toast for non-401 errors (401 is handled silently in auth context)
          if (error?.status !== 401) {
            console.error('SWR Error:', error);
            showToast.error(
              error?.message || 'An error occurred while fetching data'
            );
          }
        },
        onSuccess: (data, key, config) => {
          // Optional: Log successful fetches in development
          if (process.env.NODE_ENV === 'development') {
            console.debug('SWR Success:', key);
          }
        },
        // Keep previous data while revalidating
        keepPreviousData: true,
        // Refresh interval (disabled by default, can be enabled per hook)
        refreshInterval: 0,
      }}
    >
      {children}
    </SWRConfig>
  );
}

