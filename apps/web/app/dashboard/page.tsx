'use client';

// RADICAL APPROACH: Make dashboard a pure client component to bypass RSC streaming entirely
// This eliminates all server component execution issues
import { useEffect } from 'react';
import { DashboardPageClient } from './page-client';

export default function DashboardPage() {
  // #region agent log
  // Client-side only - this is now a client component
  // Log immediately on render to verify component is executing
  console.log('[DashboardPage] CLIENT COMPONENT RENDERING - ROUTE MATCHED!', {
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'server',
    timestamp: Date.now(),
  });
  
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] DashboardPage (client) render', JSON.stringify({
      location: 'app/dashboard/page.tsx:10',
      message: 'DashboardPage (client) render - BYPASSING RSC',
      data: { 
        pathname: window.location.pathname,
        href: window.location.href,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'client-render',
      hypothesisId: 'H6'
    }, null, 2));
    
    // Also check if component file loaded
    useEffect(() => {
      console.log('[DashboardPage] Component mounted - route is definitely matched!');
      console.log('[DashboardPage] React root exists:', !!document.getElementById('__next'));
      console.log('[DashboardPage] Children in React root:', document.getElementById('__next')?.children.length);
    }, []);
  }
  // #endregion
  
  // Pure client component - no server rendering, no RSC streaming
  // This should work because it bypasses all server component issues
  return <DashboardPageClient />;
}
