'use client';

import { SWRProvider } from '../lib/swr-config';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-providers.tsx:9',message:'AppProviders render',data:{hasChildren:!!children,pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }
  // #endregion
  // Always render SWRProvider consistently on both server and client
  // SWRProvider is safe for SSR - it only provides context
  return (
    <SWRProvider>
      {children}
    </SWRProvider>
  );
}

