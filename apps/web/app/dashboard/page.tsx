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

// CRITICAL: Try static generation first (like landing page)
// If this doesn't work, we'll need Workers + Pages convergence
// Static pages don't require RSC streaming, which is the root cause
export const dynamic = 'force-static';
export const revalidate = false;
// Don't use edge runtime - it causes RSC streaming issues
// export const runtime = 'edge';

export default function DashboardPage() {
  // CRITICAL: Add logging to verify this server component is being called
  console.log('[DashboardPage] Server component rendering');
  
  // CRITICAL: Return a simple div wrapper to avoid RSC streaming issues
  // The client component will handle all the rendering
  // This prevents Next.js from trying to stream the component, which fails on Cloudflare
  return (
    <div data-page="dashboard" data-route="/dashboard">
      <DashboardPageClient />
    </div>
  );
}
