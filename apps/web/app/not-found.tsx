import Link from 'next/link';

export default function NotFound() {
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

