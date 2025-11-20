import { Suspense } from 'react';
import { DiscoverContent } from '../../components/discover-content';

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001';

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="border-b border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Discover Content</h1>
            <nav className="flex items-center space-x-6">
              <a href="/" className="text-neutral-300 hover:text-white">
                Home
              </a>
              <a href="/docs" className="text-neutral-300 hover:text-white">
                Documentation
              </a>
              <a
                href={DASHBOARD_URL}
                className="text-neutral-300 hover:text-white"
                target="_self"
              >
                For Merchants
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
          <DiscoverContent />
        </Suspense>
      </main>
    </div>
  );
}

