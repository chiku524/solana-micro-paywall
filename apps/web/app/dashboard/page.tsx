// Ensure Next generates an edge-compatible route for Cloudflare.
export const runtime = 'edge';
// CRITICAL: Force dynamic rendering to ensure server renders on each request
// This ensures the server component actually renders HTML instead of empty RSC payload
export const dynamic = 'force-dynamic';

import { DashboardClientWrapper } from './dashboard-client-wrapper';

export default function DashboardPage() {
  // #region agent log
  // Production-safe: Log to console with structured JSON that can be copied
  if (typeof window === 'undefined') {
    // Server-side: log to console (Cloudflare Workers logs)
    console.log('[DashboardPage] Server render', JSON.stringify({
      location: 'app/dashboard/page.tsx:13',
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
      location: 'app/dashboard/page.tsx:13',
      message: 'DashboardPage (server) render',
      data: { envNodeEnv: 'client-side' },
      timestamp: Date.now(),
      sessionId: 'prod-debug',
      runId: 'client-hydration',
      hypothesisId: 'H1'
    }, null, 2));
  }
  // #endregion
  
  // CRITICAL FIX: Wrap client component in a stable server-rendered div
  // This ensures the server always renders HTML that the client can hydrate into
  // Without this wrapper, the server might render an empty RSC payload
  return (
    <div data-server-rendered="true" suppressHydrationWarning>
      <DashboardClientWrapper />
    </div>
  );
}
