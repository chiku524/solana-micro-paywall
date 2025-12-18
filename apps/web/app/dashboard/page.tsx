// Ensure Next generates an edge-compatible route for Cloudflare.
export const runtime = 'edge';

import { DashboardClientWrapper } from './dashboard-client-wrapper';

export default function DashboardPage() {
  // #region agent log
  // NOTE: This runs on the server during RSC render. It will only reach the local ingest server during local dev.
  fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-local',hypothesisId:'H1',location:'app/dashboard/page.tsx:8',message:'DashboardPage (server) render',data:{envNodeEnv:process.env.NODE_ENV ?? 'unknown'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return <DashboardClientWrapper />;
}
