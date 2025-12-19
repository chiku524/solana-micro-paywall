'use client';

// CRITICAL FIX: Make dashboard a client component to bypass RSC streaming issues
// @cloudflare/next-on-pages doesn't properly handle server components that return client components
// By making this a client component, we bypass RSC streaming entirely (like the landing page structure)
// Note: We can't use 'use client' with runtime='edge', so we remove runtime export
import { DashboardPageClient } from './page-client';

export default function DashboardPage() {
  // #region agent log
  // Production-safe: Log to browser console with structured JSON
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] DashboardPage render', JSON.stringify({
      location: 'app/dashboard/page.tsx:8',
      message: 'DashboardPage (client) render',
      data: { pathname: window.location.pathname },
      timestamp: Date.now(),
      sessionId: 'prod-debug',
      runId: 'client-render',
      hypothesisId: 'H1'
    }, null, 2));
  }
  // #endregion
  
  return <DashboardPageClient />;
}
