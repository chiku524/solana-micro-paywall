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
      location: 'app/dashboard/page.tsx:10',
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
      location: 'app/dashboard/page.tsx:10',
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
  
  // Match landing page exactly - return client component directly, no wrapper
  return <DashboardPageClient />;
}
