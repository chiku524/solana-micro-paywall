import type { Metadata } from 'next';
import { DashboardLayoutClient } from './dashboard-layout-client';

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

// CRITICAL: Force static generation for layout too
// This ensures the layout is also statically generated like the page
export const dynamic = 'force-static';
export const revalidate = false;

export const metadata: Metadata = {
  title: 'Merchant Dashboard',
  description: 'Manage your content, track payments, view analytics, and configure your merchant account on Solana Micro-Paywall.',
  keywords: [
    'merchant dashboard',
    'content management',
    'payment tracking',
    'Solana analytics',
    'merchant tools',
    'revenue tracking',
  ],
  openGraph: {
    title: 'Merchant Dashboard | Solana Micro-Paywall',
    description: 'Manage your content, track payments, and view analytics.',
    url: `${baseUrl}/dashboard`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: 'Merchant Dashboard - Solana Micro-Paywall',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Merchant Dashboard | Solana Micro-Paywall',
    description: 'Manage your content, track payments, and view analytics.',
    images: [`${baseUrl}/og-image.svg`],
  },
  alternates: {
    canonical: '/dashboard',
  },
  robots: {
    index: false, // Dashboard is private, don't index
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // #region agent log
  // Server-side logging
  if (typeof window === 'undefined') {
    console.log('[DashboardLayout] Server component rendering (static), children type:', typeof children);
  }
  // #endregion
  // CRITICAL: Render children directly - no wrapper needed
  // The landing page has no layout, so we match that pattern
  // Navbar is now in the page component itself
  return <>{children}</>;
}


