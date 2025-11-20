import Link from 'next/link';
import { apiClient } from '../lib/api-client';
import { ContentCard } from '../components/marketplace/content-card';
import { TrendingSection } from '../components/marketplace/trending-section';
import { CategoriesSection } from '../components/marketplace/categories-section';
import { MerchantLogin } from '../components/merchant-login';

export default async function HomePage() {
  const [trending, recent] = await Promise.all([
    apiClient.getTrending(6).catch(() => []),
    apiClient.discoverContents({ sort: 'newest', limit: 12 }).catch(() => ({ contents: [], total: 0, page: 1, limit: 12, totalPages: 0 })),
  ]);

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              Solana Micro-Paywall
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/marketplace" className="text-neutral-300 hover:text-white">
                Marketplace
              </Link>
              <Link href="/marketplace/discover" className="text-neutral-300 hover:text-white">
                Discover
              </Link>
              <Link href="/docs" className="text-neutral-300 hover:text-white">
                Documentation
              </Link>
              <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300">
                For Merchants
              </Link>
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
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/marketplace/discover"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-8 py-3 text-lg font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Browse All Content
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-8 py-3 text-lg font-medium text-neutral-100 transition hover:bg-neutral-800"
            >
              Merchant Dashboard
            </Link>
          </div>
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
              <Link href="/marketplace/discover?sort=newest" className="text-emerald-400 hover:text-emerald-300">
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

