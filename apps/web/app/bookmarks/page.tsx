import type { Metadata } from 'next';
import { BookmarksPageClient } from './bookmarks-client';

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

export const metadata: Metadata = {
  title: 'My Bookmarks - Saved Content',
  description: 'View and manage your bookmarked content. Access your saved premium content from the Solana Micro-Paywall marketplace.',
  keywords: [
    'bookmarks',
    'saved content',
    'favorites',
    'Solana content',
    'premium content',
  ],
  openGraph: {
    title: 'My Bookmarks - Saved Content | Solana Micro-Paywall',
    description: 'View and manage your bookmarked content from the marketplace.',
    url: `${baseUrl}/bookmarks`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: 'My Bookmarks - Solana Micro-Paywall',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Bookmarks - Saved Content',
    description: 'View and manage your bookmarked content.',
    images: [`${baseUrl}/og-image.svg`],
  },
  alternates: {
    canonical: '/bookmarks',
  },
  robots: {
    index: false, // Bookmarks are user-specific, don't index
    follow: false,
  },
};

export default function BookmarksPage() {
  return <BookmarksPageClient />;
}

