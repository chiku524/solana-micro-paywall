import type { Metadata } from 'next';
import { LibraryPageClient } from './library-client';

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

export const metadata: Metadata = {
  title: 'My Library - Purchased Content',
  description: 'Access all your purchased premium content in one place. View active and expired purchases from the Solana Micro-Paywall marketplace.',
  keywords: [
    'purchased content',
    'my library',
    'premium content access',
    'Solana purchases',
    'content library',
  ],
  openGraph: {
    title: 'My Library - Purchased Content | Solana Micro-Paywall',
    description: 'Access all your purchased premium content in one place.',
    url: `${baseUrl}/library`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: 'My Library - Solana Micro-Paywall',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Library - Purchased Content',
    description: 'Access all your purchased premium content in one place.',
    images: [`${baseUrl}/og-image.svg`],
  },
  alternates: {
    canonical: '/library',
  },
  robots: {
    index: false, // Library is user-specific, don't index
    follow: false,
  },
};

export default function LibraryPage() {
  return <LibraryPageClient />;
}

