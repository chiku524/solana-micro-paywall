import Link from 'next/link';

export default function NotFound() {
  // #region agent log
  // If /dashboard is incorrectly routed to not-found, we should see this during local pages dev.
  fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-local',hypothesisId:'H3',location:'app/not-found.tsx:6',message:'NotFound (server) render',data:{envNodeEnv:process.env.NODE_ENV ?? 'unknown'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-neutral-400 mb-8">Page not found</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-emerald-950 transition hover:bg-emerald-400"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}

