import dynamic from 'next/dynamic';

// Ensure Next generates an edge-compatible route for Cloudflare.
export const runtime = 'edge';
export const dynamic = 'force-static';

// IMPORTANT:
// Render dashboard UI purely on the client (no SSR) but keep the *route itself* server-renderable
// so next-on-pages can generate a non-not-found dashboard.rsc.
const DashboardPageClient = dynamic(() => import('./page-client').then(m => m.DashboardPageClient), {
  ssr: false,
});

export default function DashboardPage() {
  return <DashboardPageClient />;
}
