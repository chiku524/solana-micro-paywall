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

// CRITICAL: Match landing page configuration exactly
// Landing page works without any dynamic/runtime exports
// Let Next.js handle static generation naturally
// export const dynamic = 'force-static';
// export const revalidate = false;
// export const runtime = 'edge';

export default function DashboardPage() {
  // CRITICAL: Match landing page structure exactly
  // Landing page just returns the client component directly
  // No wrapper div - let Next.js handle it naturally
  return <DashboardPageClient />;
}
