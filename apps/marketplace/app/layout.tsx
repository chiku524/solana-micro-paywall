import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MarketplaceProviders } from '../components/marketplace-providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Solana Micro-Paywall Marketplace',
  description: 'Discover and purchase premium content powered by Solana',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MarketplaceProviders>{children}</MarketplaceProviders>
      </body>
    </html>
  );
}

