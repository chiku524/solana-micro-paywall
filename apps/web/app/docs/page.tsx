import type { Metadata } from 'next';
import { DocsPageClient } from './page-client';

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

export const metadata: Metadata = {
  title: 'Documentation - How to Use Solana Micro-Paywall',
  description: 'Complete guide to using Solana Micro-Paywall. Learn how to monetize content, accept Solana payments, manage your merchant dashboard, and integrate with your website.',
  keywords: [
    'Solana Micro-Paywall documentation',
    'Solana Pay integration',
    'content monetization guide',
    'merchant dashboard',
    'Solana payments tutorial',
    'web3 payments',
    'blockchain payments guide',
  ],
  openGraph: {
    title: 'Documentation - How to Use Solana Micro-Paywall',
    description: 'Complete guide to using Solana Micro-Paywall. Learn how to monetize content and accept Solana payments.',
    url: `${baseUrl}/docs`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: 'Solana Micro-Paywall Documentation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Documentation - How to Use Solana Micro-Paywall',
    description: 'Complete guide to using Solana Micro-Paywall.',
    images: [`${baseUrl}/og-image.svg`],
  },
  alternates: {
    canonical: '/docs',
  },
};

// CRITICAL: Force dynamic rendering to ensure __NEXT_DATA__ is generated
// Without this, Next.js might statically generate the page and skip __NEXT_DATA__
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// CRITICAL: Cloudflare Pages requires edge runtime for dynamic routes
export const runtime = 'edge';

export default function DocsPage() {
  return <DocsPageClient />;
}
