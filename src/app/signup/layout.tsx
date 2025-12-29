import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Sign Up - Create Merchant Account',
  description: 'Create your merchant account and start monetizing your content. Get your Merchant ID and begin accepting blockchain payments in minutes.',
  url: '/signup',
});

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

