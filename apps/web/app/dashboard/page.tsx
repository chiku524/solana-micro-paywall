import type { Metadata } from 'next';
import { DashboardPageClient } from './page-client';

// CRITICAL FIX: Make dashboard a server component like the landing page
// @cloudflare/next-on-pages properly handles server components that return client components
// when they're statically generated (no runtime='edge', no dynamic='force-dynamic')
// This matches the landing page pattern exactly
export const metadata: Metadata = {
  title: 'Dashboard | Solana Micro-Paywall',
  description: 'Manage your content, payments, and analytics',
};

export default function DashboardPage() {
  // #region agent log
  // Production-safe: Log to console (server-side in Cloudflare Workers logs)
  if (typeof window === 'undefined') {
    console.log('[DashboardPage] Server render', JSON.stringify({
      location: 'app/dashboard/page.tsx:15',
      message: 'DashboardPage (server) render',
      data: { envNodeEnv: process.env.NODE_ENV ?? 'unknown' },
      timestamp: Date.now(),
      sessionId: 'prod-debug',
      runId: 'server-render',
      hypothesisId: 'H1'
    }));
  }
  // #endregion
  
  return <DashboardPageClient />;
}
