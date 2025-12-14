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

// CRITICAL: Force dynamic rendering to ensure __NEXT_DATA__ is generated
// Without this, Next.js might statically generate the page and skip __NEXT_DATA__
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// CRITICAL: Cloudflare Pages requires edge runtime for dynamic routes
export const runtime = 'edge';

export default function DashboardPage() {
  // CRITICAL: Add logging to verify this server component is being called
  console.log('[DashboardPage] Server component rendering');
  
  // Ensure this is a server component that always renders the dashboard
  // This should only be called when the route is /dashboard
  return <DashboardPageClient />;
}
