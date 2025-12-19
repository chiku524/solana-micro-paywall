// Ensure Next generates an edge-compatible route for Cloudflare.
export const runtime = 'edge';

import { DashboardClientWrapper } from './dashboard-client-wrapper';

export default function DashboardPage() {
  // #region agent log
  // Production-safe: Log to console with structured JSON that can be copied
  if (typeof window === 'undefined') {
    // Server-side: log to console (Cloudflare Workers logs)
    console.log('[DashboardPage] Server render', JSON.stringify({
      location: 'app/dashboard/page.tsx:11',
      message: 'DashboardPage (server) render',
      data: { envNodeEnv: process.env.NODE_ENV ?? 'unknown' },
      timestamp: Date.now(),
      sessionId: 'prod-debug',
      runId: 'server-render',
      hypothesisId: 'H1'
    }));
  } else {
    // Client-side: log to browser console with structured JSON
    console.log('[DEBUG] DashboardPage server render', JSON.stringify({
      location: 'app/dashboard/page.tsx:11',
      message: 'DashboardPage (server) render',
      data: { envNodeEnv: 'client-side' },
      timestamp: Date.now(),
      sessionId: 'prod-debug',
      runId: 'client-hydration',
      hypothesisId: 'H1'
    }, null, 2));
  }
  // #endregion
  return <DashboardClientWrapper />;
}
