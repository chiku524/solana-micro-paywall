'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '../../../components/dashboard/navbar';
import { apiClient } from '../../../lib/api-client';
import { DashboardProviders } from '../../../components/dashboard-providers';

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get('merchantId') || '';
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Analytics page - can show charts and graphs here
    setLoading(false);
  }, [merchantId]);

  if (loading) {
    return (
      <DashboardProviders>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
            <p className="text-neutral-400">Loading analytics...</p>
          </div>
        </div>
      </DashboardProviders>
    );
  }

  return (
    <DashboardProviders>
      <Navbar />
      <div className="min-h-screen bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="mt-2 text-neutral-400">Payment analytics and insights</p>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-8 text-center">
            <p className="text-neutral-400">
              Analytics charts and graphs will be displayed here.
              <br />
              Integration with charting libraries (e.g., Chart.js, Recharts) can be added.
            </p>
          </div>
        </div>
      </div>
    </DashboardProviders>
  );
}

