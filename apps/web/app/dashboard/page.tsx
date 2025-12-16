import type { Metadata } from 'next';
import { DashboardPageClient } from './page-client';

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

export const metadata: Metadata = {
  title: 'Merchant Dashboard - Solana Micro-Paywall',
  description: 'Manage your merchant account, view payment statistics, and access your premium content dashboard.',
  keywords: [
    'merchant dashboard',
    'Solana payments',
    'payment statistics',
    'merchant account',
    'content monetization',
  ],
  openGraph: {
    title: 'Merchant Dashboard - Solana Micro-Paywall',
    description: 'Manage your merchant account and view payment statistics.',
    url: `${baseUrl}/dashboard`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: 'Solana Micro-Paywall Merchant Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Merchant Dashboard - Solana Micro-Paywall',
    description: 'Manage your merchant account and view payment statistics.',
    images: [`${baseUrl}/og-image.svg`],
  },
  alternates: {
    canonical: '/dashboard',
  },
};

// CRITICAL: Match landing page structure exactly - server component returning client component
// The landing page works with this pattern, so we should match it
export default function DashboardPage() {
  // #region agent log
  // Server-side logging
  if (typeof window === 'undefined') {
    console.log('[DashboardPage] Server component rendering');
  }
  // #endregion
  // Match landing page structure exactly - just return the client component
  return <DashboardPageClient />;
}
