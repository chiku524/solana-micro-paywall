import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Dashboard - Merchant Control Center',
  description: 'Manage your content, track earnings, and view analytics. Complete merchant dashboard for content creators and publishers.',
  url: '/dashboard',
  noindex: true, // Dashboard is authenticated, should not be indexed
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

