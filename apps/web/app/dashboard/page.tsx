'use client';

// CRITICAL FIX: Make dashboard page fully client-side to match landing page pattern
// Server components don't render HTML on Cloudflare Pages with @cloudflare/next-on-pages
// By making this a client component, we ensure it renders properly
import { DashboardPageClient } from './page-client';

export default function DashboardPage() {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:8',message:'DashboardPage render (now client component)',data:{pathname:typeof window !== 'undefined' ? window.location.pathname : 'server'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  // Match landing page structure exactly - just return the client component
  return <DashboardPageClient />;
}
