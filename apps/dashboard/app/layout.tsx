import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Solana Micro-Paywall Dashboard',
  description:
    'Merchant dashboard for managing Solana micro-paywall payments, configuration, and analytics.',
  icons: {
    icon: '/favicon.ico',
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen bg-neutral-950 text-neutral-100`}>
        {children}
      </body>
    </html>
  );
}

