import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Discover Content - Browse All',
  description: 'Browse and discover all available content. Filter by category, search by keyword, and find the perfect content for you.',
  url: '/marketplace/discover',
});

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

