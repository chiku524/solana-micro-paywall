import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'My Library - Purchased Content',
  description: 'Access all your purchased content in one place. View active and expired purchases, organize by date or merchant, and quickly access your digital content library.',
  url: '/library',
  noindex: true, // Library is user-specific, should not be indexed
});

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

