'use client';

import { DashboardPageClient } from './page-client';

export function DashboardClientWrapper() {
  // #region agent log
  // Production-safe: Log to browser console with structured JSON
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] DashboardClientWrapper render', JSON.stringify({
      location: 'app/dashboard/dashboard-client-wrapper.tsx:7',
      message: 'DashboardClientWrapper (client) render',
      data: { pathname: window.location.pathname },
      timestamp: Date.now(),
      sessionId: 'prod-debug',
      runId: 'client-render',
      hypothesisId: 'H2'
    }, null, 2));
  }
  // #endregion
  return <DashboardPageClient />;
}


