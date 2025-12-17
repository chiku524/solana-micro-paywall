'use client';

import React from 'react';
import { SWRConfig } from 'swr';

// Default fetcher for SWR - can be overridden per hook
const fetcher = async (url: string) => {
  // This is a placeholder - individual hooks should use specific API client methods
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export const swrConfig = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: (error: any) => {
    // Don't retry on 4xx errors
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    return true;
  },
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'swr-config.tsx:32',message:'SWRProvider render',data:{hasChildren:!!children,pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }
  // #endregion
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}

