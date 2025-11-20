export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
      <div className="mb-4 h-48 w-full rounded-lg bg-neutral-800" />
      <div className="mb-2 h-4 w-3/4 rounded bg-neutral-800" />
      <div className="mb-4 h-4 w-1/2 rounded bg-neutral-800" />
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 rounded bg-neutral-800" />
        <div className="h-6 w-32 rounded bg-neutral-800" />
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="mb-2 h-4 w-1/4 rounded bg-neutral-800" />
          <div className="mb-2 h-4 w-3/4 rounded bg-neutral-800" />
          <div className="h-4 w-1/2 rounded bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/60">
      <div className="border-b border-neutral-800 px-6 py-4">
        <div className="h-4 w-32 rounded bg-neutral-800" />
      </div>
      <div className="divide-y divide-neutral-800">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="h-4 w-32 rounded bg-neutral-800" />
              <div className="h-4 w-48 rounded bg-neutral-800" />
              <div className="h-4 w-24 rounded bg-neutral-800" />
              <div className="h-4 w-32 rounded bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
        <p className="text-neutral-400">Loading...</p>
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`h-4 animate-pulse rounded bg-neutral-800 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

