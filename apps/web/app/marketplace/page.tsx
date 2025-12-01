import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { apiClient, type Content, type DiscoverResponse } from '../../lib/api-client';
import { ContentCard } from '../../components/marketplace/content-card';
import { TrendingSection } from '../../components/marketplace/trending-section';
import { CategoriesSection } from '../../components/marketplace/categories-section';
import { RecommendationsSection } from '../../components/marketplace/recommendations-section';
import { MarketplaceClientWrapper } from './marketplace-client-wrapper';

// Force dynamic rendering to prevent prefetch issues on Cloudflare Pages
// This ensures the page is always rendered server-side and not statically prefetched
// CRITICAL: These exports must be at the top level to prevent Next.js from statically generating
export const runtime = 'edge'; // Required for Cloudflare Pages
export const dynamic = 'force-dynamic';
export const dynamicParams = true; // Allow dynamic route parameters
export const revalidate = 0; // Disable ISR to prevent prefetch cache issues
export const fetchCache = 'force-no-store'; // Disable fetch caching to force dynamic
// Prevent Next.js from generating any static HTML or prerender fallbacks
export const prerender = false; // Explicitly disable prerendering

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

// Removed safeFetch helper - using inline Promise.race instead for better error handling

export default async function MarketplacePage() {
  // CRITICAL: This page MUST always render successfully, even if API calls fail
  // Never throw errors - always render the page with empty data if needed
  // This prevents Next.js from returning 503/500, which gets cached by browsers
  // 
  // IMPORTANT: Edge runtime has strict timeout limits. If API calls take too long,
  // the edge runtime will timeout and return 503. We use very short timeouts (2s)
  // to prevent this.
  
  // Force dynamic rendering by using headers() - this ensures Next.js treats this as dynamic
  // This is a workaround for Next.js 14 sometimes ignoring force-dynamic
  // Calling headers() marks the page as dynamic and prevents static generation
  headers(); // This will force Next.js to treat this route as dynamic
  
  let trending: Content[] = [];
  let recent: DiscoverResponse = { contents: [], total: 0, page: 1, limit: 12, totalPages: 0 };
  
  // Use Promise.allSettled with VERY short timeouts (2s) to prevent edge runtime timeouts
  // Edge runtime has a ~30s total timeout, but individual requests can timeout faster
  // If API calls fail or timeout, we'll just render with empty data
  try {
    // Create promises with individual error handling
    const trendingPromise = (async () => {
      try {
        // Use a VERY short timeout (2s) to prevent edge runtime timeouts
        // Edge runtime can timeout faster than expected, so we use aggressive timeouts
        const result = await Promise.race([
          apiClient.getTrending(6),
          new Promise<Content[]>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
          ),
        ]);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('[Marketplace] Failed to load trending:', error);
        return [] as Content[];
      }
    })();
    
    const recentPromise = (async () => {
      try {
        const result = await Promise.race([
          apiClient.discoverContents({ sort: 'newest', limit: 12 }),
          new Promise<DiscoverResponse>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
          ),
        ]);
        return result || { contents: [], total: 0, page: 1, limit: 12, totalPages: 0 };
      } catch (error) {
        console.error('[Marketplace] Failed to load recent:', error);
        return { contents: [], total: 0, page: 1, limit: 12, totalPages: 0 } as DiscoverResponse;
      }
    })();
    
    // Wait for both promises to settle (even if they fail)
    const [trendingResult, recentResult] = await Promise.allSettled([
      trendingPromise,
      recentPromise,
    ]);
    
    // Extract results safely
    if (trendingResult.status === 'fulfilled') {
      trending = trendingResult.value || [];
    }
    
    if (recentResult.status === 'fulfilled') {
      recent = recentResult.value || { contents: [], total: 0, page: 1, limit: 12, totalPages: 0 };
    }
  } catch (error) {
    // Final safety net - if anything throws, use empty data
    // This should never happen due to Promise.allSettled, but just in case
    console.error('[Marketplace] Unexpected error in marketplace page:', error);
    trending = [];
    recent = { contents: [], total: 0, page: 1, limit: 12, totalPages: 0 };
  }
  
  // CRITICAL: This function must NEVER throw - it must always return JSX
  // If we throw here, Next.js will return 503/500, which gets cached by browsers
  
  // Log for debugging - this will appear in server logs
  console.log('[Marketplace] Rendering marketplace page with:', {
    trendingCount: trending.length,
    recentCount: recent.contents.length,
    timestamp: new Date().toISOString(),
  });

  return (
    <MarketplaceClientWrapper>
      <div className="min-h-screen relative z-10">
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


