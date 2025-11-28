import type { Metadata } from 'next';
import { DashboardLayoutClient } from './dashboard-layout-client';

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

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
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}


