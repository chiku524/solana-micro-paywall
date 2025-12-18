'use client';

import { DashboardPageClient } from './page-client';

export function DashboardClientWrapper() {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-local',hypothesisId:'H2',location:'app/dashboard/dashboard-client-wrapper.tsx:6',message:'DashboardClientWrapper (client) render',data:{pathname:typeof window!=='undefined'?window.location.pathname:'server'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return <DashboardPageClient />;
}


