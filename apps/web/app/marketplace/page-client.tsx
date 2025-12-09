'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, type Content, type DiscoverResponse } from '../../lib/api-client';
import { ContentCard } from '../../components/marketplace/content-card';
import { TrendingSection } from '../../components/marketplace/trending-section';
import { RecommendationsSection } from '../../components/marketplace/recommendations-section';
import { MarketplaceClientWrapper } from './marketplace-client-wrapper';

// Client component for categories
function CategoriesSectionClient() {
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || categories.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-3xl font-bold text-white">Browse by Category</h2>
      <div className="flex flex-wrap gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.category}
            href={`/marketplace/discover?category=${encodeURIComponent(cat.category)}`}
            prefetch={false}
            className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-2 text-neutral-300 transition hover:border-emerald-500/50 hover:bg-neutral-900 hover:text-white"
          >
            {cat.category} ({cat.count})
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MarketplacePageClient() {
  const [trending, setTrending] = useState<Content[]>([]);
  const [recent, setRecent] = useState<DiscoverResponse>({ contents: [], total: 0, page: 1, limit: 12, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data on client side
    Promise.allSettled([
      apiClient.getTrending(6).catch(() => []),
      apiClient.discoverContents({ sort: 'newest', limit: 12 }).catch(() => ({ contents: [], total: 0, page: 1, limit: 12, totalPages: 0 })),
    ]).then(([trendingResult, recentResult]) => {
      if (trendingResult.status === 'fulfilled') {
        setTrending(Array.isArray(trendingResult.value) ? trendingResult.value : []);
      }
      if (recentResult.status === 'fulfilled') {
        setRecent(recentResult.value || { contents: [], total: 0, page: 1, limit: 12, totalPages: 0 });
      }
      setLoading(false);
    });
  }, []);

  return (
    <MarketplaceClientWrapper>
      <div className="min-h-screen relative z-10" data-page="marketplace">
        {/* Header */}
        <header className="border-b border-neutral-800 bg-neutral-900/60">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link href="/" prefetch={false} className="text-xl sm:text-2xl font-bold text-white">
                Solana Paywall Marketplace
              </Link>
              <nav className="hidden md:flex md:items-center md:space-x-4 lg:space-x-6">
                <Link href="/marketplace/discover" prefetch={false} className="text-sm lg:text-base text-neutral-300 hover:text-white">
                  Discover
                </Link>
                <Link href="/library" prefetch={false} className="text-sm lg:text-base text-neutral-300 hover:text-white">
                  My Library
                </Link>
                <Link href="/docs" prefetch={false} className="text-sm lg:text-base text-neutral-300 hover:text-white">
                  Documentation
                </Link>
                <Link href="/dashboard" prefetch={false} className="text-sm lg:text-base text-emerald-400 hover:text-emerald-300">
                  For Merchants
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <section className="mb-8 sm:mb-12 text-center">
            <h1 className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Discover Premium Content</h1>
            <p className="mb-6 sm:mb-8 text-base sm:text-lg lg:text-xl text-neutral-400 px-4">
              Access exclusive articles, videos, courses, and more with Solana payments
            </p>
            <Link
              href="/marketplace/discover"
              prefetch={false}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Browse All Content
            </Link>
          </section>

          {loading ? (
            <div className="text-center py-12">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
              <p className="text-neutral-400">Loading content...</p>
            </div>
          ) : (
            <>
              {/* Trending Section */}
              {trending.length > 0 && (
                <TrendingSection title="Trending Now" contents={trending} />
              )}

              {/* Categories */}
              <CategoriesSectionClient />

              {/* Recent Content */}
              {recent.contents.length > 0 && (
                <section className="mt-8 sm:mt-12">
                  <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Recently Added</h2>
                    <Link href="/marketplace/discover?sort=newest" prefetch={false} className="text-sm sm:text-base text-emerald-400 hover:text-emerald-300">
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

              {/* Recommendations */}
              <RecommendationsSection limit={8} />
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-neutral-800 bg-neutral-900/60 py-8">
          <div className="mx-auto max-w-7xl px-4 text-center text-neutral-400 sm:px-6 lg:px-8">
            <p>Powered by Solana Micro-Paywall</p>
          </div>
        </footer>
      </div>
    </MarketplaceClientWrapper>
  );
}

