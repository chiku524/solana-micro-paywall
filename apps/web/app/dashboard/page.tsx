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

// CRITICAL FIX: Match landing page structure exactly
// Landing page is a server component that returns a client component
// Landing page has NO layout file - it works without one
// By removing the layout and making this a server component, we match the working pattern
export default function DashboardPage() {
  // #region agent log
  // Server-side logging
  if (typeof window === 'undefined') {
    console.log('[DashboardPage] Server component rendering (matching landing page pattern)');
  }
  // #endregion
  // CRITICAL: Add a wrapper div with data attribute to verify server component renders HTML
  // This ensures there's HTML for React to hydrate against
  return (
    <div data-dashboard-page="true" style={{ minHeight: '100vh' }}>
      <DashboardPageClient />
    </div>
  );
}
