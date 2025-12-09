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

export default function DocsPage() {
  return <DocsPageClient />;
}
