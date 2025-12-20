import type { Metadata } from 'next';
import { DashboardPageClient } from './page-client';

// FRESH APPROACH: Match landing page exactly - no dynamic/revalidate exports
// Landing page works, so we'll use the exact same pattern
export const metadata: Metadata = {
  title: 'Dashboard | Solana Micro-Paywall',
  description: 'Manage your content, payments, and analytics',
};

export default function DashboardPage() {
  // #region agent log
  // Server-side: Log to console (Cloudflare Workers logs)
  if (typeof window === 'undefined') {
    console.log('[DashboardPage] Server render', JSON.stringify({
      location: 'app/dashboard/page.tsx:11',
      message: 'DashboardPage (server) render - EXECUTING',
      data: { 
        envNodeEnv: process.env.NODE_ENV ?? 'unknown',
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'server-render',
      hypothesisId: 'H3'
    }));
  } else {
    // Client-side: Log to browser console
    console.log('[DEBUG] DashboardPage server render (client-side)', JSON.stringify({
      location: 'app/dashboard/page.tsx:11',
      message: 'DashboardPage (server) render - CLIENT HYDRATION',
      data: { 
        pathname: window.location.pathname,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'client-hydration',
      hypothesisId: 'H3'
    }, null, 2));
  }
  // #endregion
  
  // CRITICAL: Render static HTML structure first to ensure server always emits HTML
  // This prevents empty RSC boundaries that cause hydration failures
  // The client component will replace this on mount
  return (
    <>
      {/* Server-rendered HTML that ensures structure exists */}
      <div 
        data-page="dashboard" 
        data-route="/dashboard" 
        className="min-h-screen bg-transparent relative z-10"
        suppressHydrationWarning
      >
        {/* Placeholder content that will be replaced by client component */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="mb-4 h-8 w-48 animate-pulse rounded bg-neutral-800" />
            <div className="h-4 w-64 animate-pulse rounded bg-neutral-800" />
          </div>
        </div>
      </div>
      {/* Client component will hydrate and render actual content */}
      <DashboardPageClient />
    </>
  );
}
