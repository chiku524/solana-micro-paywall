'use client';

// RADICAL APPROACH: Make dashboard a pure client component to bypass RSC streaming entirely
// This eliminates all server component execution issues
import { DashboardPageClient } from './page-client';

export default function DashboardPage() {
  // #region agent log
  // Client-side only - this is now a client component
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] DashboardPage (client) render', JSON.stringify({
      location: 'app/dashboard/page.tsx:7',
      message: 'DashboardPage (client) render - BYPASSING RSC',
      data: { 
        pathname: window.location.pathname,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'client-render',
      hypothesisId: 'H6'
    }, null, 2));
  }
  // #endregion
  
  // Pure client component - no server rendering, no RSC streaming
  // This should work because it bypasses all server component issues
  return <DashboardPageClient />;
}
