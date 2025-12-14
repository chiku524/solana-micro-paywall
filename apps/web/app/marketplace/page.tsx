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

// CRITICAL: Force dynamic rendering to ensure __NEXT_DATA__ is generated
// Without this, Next.js might statically generate the page and skip __NEXT_DATA__
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MarketplacePage() {
  return <MarketplacePageClient />;
}
