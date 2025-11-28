import type { Metadata } from 'next';
import Link from 'next/link';
import { apiClient, type Content, type DiscoverResponse } from '../../lib/api-client';
import { ContentCard } from '../../components/marketplace/content-card';
import { TrendingSection } from '../../components/marketplace/trending-section';
import { CategoriesSection } from '../../components/marketplace/categories-section';
import { RecommendationsSection } from '../../components/marketplace/recommendations-section';

export const revalidate = 60; // ISR: Revalidate every 60 seconds

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

export const metadata: Metadata = {
  title: 'Marketplace - Discover Premium Content',
  description: 'Browse and discover premium content from creators worldwide. Articles, videos, courses, and digital products available for purchase with instant Solana payments.',
  keywords: [
    'Solana marketplace',
    'premium content',
    'digital products',
    'content discovery',
    'Solana payments',
    'web3 marketplace',
    'creator content',
  ],
  openGraph: {
    title: 'Marketplace - Discover Premium Content | Solana Micro-Paywall',
    description: 'Browse and discover premium content from creators worldwide. Purchase with instant Solana payments.',
    url: `${baseUrl}/marketplace`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: 'Solana Micro-Paywall Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace - Discover Premium Content',
    description: 'Browse and discover premium content from creators worldwide.',
    images: [`${baseUrl}/og-image.svg`],
  },
  alternates: {
    canonical: '/marketplace',
  },
};

export default async function MarketplacePage() {
  // Wrap API calls in try-catch to prevent 503 errors during prefetch
  let trending: Content[] = [];
  let recent: DiscoverResponse = { contents: [], total: 0, page: 1, limit: 12, totalPages: 0 };
  
  try {
    [trending, recent] = await Promise.all([
      apiClient.getTrending(6).catch(() => [] as Content[]),
      apiClient.discoverContents({ sort: 'newest', limit: 12 }).catch(() => ({ contents: [], total: 0, page: 1, limit: 12, totalPages: 0 }) as DiscoverResponse),
    ]);
  } catch (error) {
    // If API calls fail, render page with empty data instead of throwing
    // This prevents 503 errors during prefetch
    console.error('Failed to load marketplace data:', error);
    trending = [];
    recent = { contents: [], total: 0, page: 1, limit: 12, totalPages: 0 };
  }

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-white">
              Solana Paywall Marketplace
            </Link>
            <nav className="hidden md:flex md:items-center md:space-x-4 lg:space-x-6">
              <Link href="/marketplace/discover" className="text-sm lg:text-base text-neutral-300 hover:text-white">
                Discover
              </Link>
              <Link href="/library" className="text-sm lg:text-base text-neutral-300 hover:text-white">
                My Library
              </Link>
              <Link href="/docs" className="text-sm lg:text-base text-neutral-300 hover:text-white">
                Documentation
              </Link>
              <Link href="/dashboard" className="text-sm lg:text-base text-emerald-400 hover:text-emerald-300">
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
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-medium text-emerald-950 transition hover:bg-emerald-400"
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
          <section className="mt-8 sm:mt-12">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Recently Added</h2>
              <Link href="/marketplace/discover?sort=newest" className="text-sm sm:text-base text-emerald-400 hover:text-emerald-300">
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


