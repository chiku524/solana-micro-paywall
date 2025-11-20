'use client';

import { Suspense } from 'react';

function AnalyticsPageContent() {
  return (
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
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
            <p className="text-neutral-400">Loading...</p>
          </div>
        </div>
      }
    >
      <AnalyticsPageContent />
    </Suspense>
  );
}


