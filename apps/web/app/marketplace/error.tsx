'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error('[Marketplace] Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800 p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Failed to load marketplace</h2>
          <p className="text-red-300 mb-4">
            {error.message || 'An unexpected error occurred while loading the marketplace'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="rounded-lg border border-neutral-700 px-6 py-2 font-medium text-neutral-300 transition hover:bg-neutral-800"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

