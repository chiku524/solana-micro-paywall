import type { Metadata } from 'next';
import { DashboardPageClient } from './page-client';

// CRITICAL FIX: Make dashboard a server component like the landing page
// @cloudflare/next-on-pages properly handles server components that return client components
// when they're statically generated (no runtime='edge', no dynamic='force-dynamic')
// This matches the landing page pattern exactly
// EXPLICITLY force static generation to match docs/marketplace pattern
export const dynamic = 'force-static';
export const revalidate = false;
export const metadata: Metadata = {
  title: 'Dashboard | Solana Micro-Paywall',
  description: 'Manage your content, payments, and analytics',
};

export default function DashboardPage() {
  // #region agent log
  // Server-side: Log to console (Cloudflare Workers logs)
  if (typeof window === 'undefined') {
    console.log('[DashboardPage] Server render', JSON.stringify({
      location: 'app/dashboard/page.tsx:16',
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
      location: 'app/dashboard/page.tsx:16',
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
  
  // CRITICAL FIX: Render a stable wrapper div that ensures HTML is always present
  // This prevents empty RSC boundaries that cause hydration mismatches
  // The client component will hydrate into this structure
  return (
    <div data-page="dashboard" data-route="/dashboard" suppressHydrationWarning>
      <DashboardPageClient />
    </div>
  );
}
