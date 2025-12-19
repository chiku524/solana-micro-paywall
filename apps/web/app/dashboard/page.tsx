// Ensure Next generates an edge-compatible route for Cloudflare.
export const runtime = 'edge';
// CRITICAL: Force dynamic rendering to ensure server renders on each request
// This ensures the server component actually renders HTML instead of empty RSC payload
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
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
  
  // CRITICAL FIX: Render fallback content directly in server component
  // @cloudflare/next-on-pages doesn't serialize client components properly,
  // so we render the fallback HTML directly and let the client component replace it
  return (
    <div data-page="dashboard" data-route="/dashboard" suppressHydrationWarning>
      {/* Server-rendered fallback that ensures HTML is always present */}
      <div className="min-h-screen bg-transparent relative z-10" data-page="dashboard" id="dashboard-server-fallback">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="mb-4 h-8 w-48 animate-pulse rounded bg-neutral-800" />
            <div className="h-4 w-64 animate-pulse rounded bg-neutral-800" />
          </div>
        </div>
      </div>
      {/* Client component will replace the fallback on mount */}
      <DashboardClientWrapper />
    </div>
  );
}
