'use client';

// CRITICAL FIX: Make dashboard layout fully client-side to bypass server component rendering issues
// Server components don't render HTML on Cloudflare Pages with @cloudflare/next-on-pages
// By making this a client component, we bypass server rendering entirely
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:8',message:'DashboardLayout render (fully client-side)',data:{pathname:typeof window !== 'undefined' ? window.location.pathname : 'server',childrenType:typeof children},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  // Render children directly - no wrapper needed
  // Navbar is in the page component itself
  return <>{children}</>;
}


