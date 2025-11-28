import type { Metadata } from 'next';
import { LandingPageClient } from './landing-page-client';

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

export const metadata: Metadata = {
  title: 'Monetize Content with Instant Solana Payments',
  description: 'The easiest way for creators, publishers, and API providers to accept instant Solana payments and grant access to premium content. Sub-second confirmations, near-zero fees, global marketplace.',
  keywords: [
    'Solana payments',
    'content monetization',
    'creator economy',
    'micropayments',
    'blockchain payments',
    'web3 marketplace',
    'Solana Pay',
    'digital content sales',
  ],
  openGraph: {
    title: 'Solana Micro-Paywall - Monetize Content with Instant Solana Payments',
    description: 'The easiest way for creators to accept instant Solana payments. Sub-second confirmations, near-zero fees, global marketplace.',
    url: baseUrl,
    siteName: 'Solana Micro-Paywall',
    images: [
      {
        url: `${baseUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: 'Solana Micro-Paywall - Instant Solana Payments for Content Creators',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana Micro-Paywall - Monetize Content with Instant Solana Payments',
    description: 'The easiest way for creators to accept instant Solana payments. Sub-second confirmations, near-zero fees.',
    images: [`${baseUrl}/og-image.svg`],
  },
  alternates: {
    canonical: '/',
  },
};

export default function LandingPage() {
  return <LandingPageClient />;
}
