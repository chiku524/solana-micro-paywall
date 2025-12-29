import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Content Details - View & Purchase',
  description: 'View content details, preview, and purchase premium digital content with instant blockchain payments.',
  url: '/marketplace/content',
});

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

