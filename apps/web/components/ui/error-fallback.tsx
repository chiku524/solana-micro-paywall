'use client';

export function ErrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-red-400 mb-2">Something went wrong</h2>
        <p className="text-red-300 mb-4">Please refresh the page</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-emerald-950 transition hover:bg-emerald-400"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

