import type { Metadata } from 'next';
import { MarketplacePageClient } from './page-client';

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

// CRITICAL: Try static generation first (like landing page)
// Static pages don't require RSC streaming, which is the root cause
export const dynamic = 'force-static';
export const revalidate = false;
// Static route; do not force edge runtime (Next warns runtime=edge is incompatible with force-static).

export default function MarketplacePage() {
  // CRITICAL: Return a simple div wrapper to avoid RSC streaming issues
  return (
    <div data-page="marketplace" data-route="/marketplace">
      <MarketplacePageClient />
    </div>
  );
}
