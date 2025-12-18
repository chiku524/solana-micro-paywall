// Ensure Next generates an edge-compatible route for Cloudflare.
export const runtime = 'edge';
export const dynamic = 'force-static';

import { DashboardClientWrapper } from './dashboard-client-wrapper';

export default function DashboardPage() {
  return <DashboardClientWrapper />;
}
