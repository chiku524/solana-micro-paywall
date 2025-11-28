import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { DiscoverContent } from '../../../components/marketplace/discover-content';

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

export const metadata: Metadata = {
  title: 'Discover Content - Browse All Premium Content',
  description: 'Search and filter through all available premium content. Find articles, videos, courses, and digital products by category, price, and more. Purchase with instant Solana payments.',
  keywords: [
    'content discovery',
    'browse content',
    'search content',
    'premium content',
    'Solana marketplace',
    'content filter',
  ],
  openGraph: {
    title: 'Discover Content - Browse All Premium Content | Solana Micro-Paywall',
    description: 'Search and filter through all available premium content. Find exactly what you are looking for.',
    url: `${baseUrl}/marketplace/discover`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: 'Discover Content - Solana Micro-Paywall',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Content - Browse All Premium Content',
    description: 'Search and filter through all available premium content.',
    images: [`${baseUrl}/og-image.svg`],
  },
  alternates: {
    canonical: '/marketplace/discover',
  },
};

export default function DiscoverPage() {
  return (
    <div className="min-h-screen relative z-10">
      <header className="border-b border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/marketplace" className="text-2xl font-bold text-white">
              Discover Content
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/" className="text-neutral-300 hover:text-white">
                Home
              </Link>
              <Link href="/marketplace" className="text-neutral-300 hover:text-white">
                Marketplace
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
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
                <p className="text-neutral-400">Loading...</p>
              </div>
            </div>
          }
        >
          <DiscoverContent />
        </Suspense>
      </main>
    </div>
  );
}


