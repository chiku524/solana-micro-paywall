'use client';

// CRITICAL FIX: Make dashboard page fully client-side to bypass server component rendering issues
// Server components don't render HTML on Cloudflare Pages with @cloudflare/next-on-pages
// By making this a client component, we bypass server rendering entirely
// This is an alternative solution since server component approaches haven't worked
import { DashboardPageClient } from './page-client';
import { useEffect } from 'react';

export default function DashboardPage() {
  // #region agent log
  useEffect(() => {
    console.log('[DashboardPage] Client component mounted');
    fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:12',message:'DashboardPage mounted (fully client-side)',data:{pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'A'})}).catch(()=>{});
  }, []);
  // #endregion
  
  // CRITICAL: Render immediately on client - no server rendering needed
  // This ensures the component mounts and renders on the client side
  return <DashboardPageClient />;
}
