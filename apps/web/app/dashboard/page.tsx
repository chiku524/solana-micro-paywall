'use client';

// CRITICAL FIX: Make dashboard page fully client-side to bypass server component rendering issues
// Server components don't render HTML on Cloudflare Pages with @cloudflare/next-on-pages
// By making this a client component, we bypass server rendering entirely
import { DashboardPageClient } from './page-client';

export default function DashboardPage() {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:8',message:'DashboardPage render (fully client-side)',data:{pathname:typeof window !== 'undefined' ? window.location.pathname : 'server'},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return <DashboardPageClient />;
}
