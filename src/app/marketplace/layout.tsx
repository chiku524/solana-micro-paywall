import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { MarketplaceLocaleProvider } from '@/components/marketplace-locale-provider';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Marketplace - Discover Premium Content',
  description: 'Browse and purchase premium content from creators. Discover trending content, explore categories, and unlock exclusive digital content with blockchain payments.',
  url: '/marketplace',
});

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketplaceLocaleProvider>{children}</MarketplaceLocaleProvider>;
}

