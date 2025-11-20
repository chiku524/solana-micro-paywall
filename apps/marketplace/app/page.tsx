import Link from 'next/link';
import { marketplaceApi } from '../lib/api-client';
import { ContentCard } from '../components/content-card';
import { TrendingSection } from '../components/trending-section';
import { CategoriesSection } from '../components/categories-section';

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001';

export default async function HomePage() {
  const [trending, recent] = await Promise.all([
    marketplaceApi.getTrending(6),
    marketplaceApi.discoverContents({ sort: 'newest', limit: 12 }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              Solana Paywall Marketplace
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/discover" className="text-neutral-300 hover:text-white">
                Discover
              </Link>
              <Link href="/docs" className="text-neutral-300 hover:text-white">
                Documentation
              </Link>
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
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white">Discover Premium Content</h1>
          <p className="mb-8 text-xl text-neutral-400">
            Access exclusive articles, videos, courses, and more with Solana payments
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-8 py-3 text-lg font-medium text-emerald-950 transition hover:bg-emerald-400"
          >
            Browse All Content
          </Link>
        </section>

        {/* Trending Section */}
        {trending.length > 0 && (
          <TrendingSection title="Trending Now" contents={trending} />
        )}

        {/* Categories */}
        <CategoriesSection />

        {/* Recent Content */}
        {recent.contents.length > 0 && (
          <section className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Recently Added</h2>
              <Link href="/discover?sort=newest" className="text-emerald-400 hover:text-emerald-300">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recent.contents.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-800 bg-neutral-900/60 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-neutral-400 sm:px-6 lg:px-8">
          <p>Powered by Solana Micro-Paywall</p>
        </div>
      </footer>
    </div>
  );
}

