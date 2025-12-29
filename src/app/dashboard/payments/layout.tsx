import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Payment History - All Transactions',
  description: 'View complete payment history and transaction details for all your content sales.',
  url: '/dashboard/payments',
  noindex: true,
});

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

