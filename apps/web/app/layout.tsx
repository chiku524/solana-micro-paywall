import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '../components/app-providers';
import { ToastProvider } from '../components/ui/toast-provider';
import { BackgroundAnimation } from '../components/ui/background-animation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Solana Micro-Paywall',
    template: '%s | Solana Micro-Paywall',
  },
  description: 'Micro-paywall platform for Solana Pay - Marketplace and Merchant Dashboard',
  keywords: ['Solana', 'Paywall', 'Blockchain', 'Payments', 'Marketplace', 'Content'],
  authors: [{ name: 'Solana Micro-Paywall' }],
  creator: 'Solana Micro-Paywall',
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3001'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Solana Micro-Paywall',
    title: 'Solana Micro-Paywall',
    description: 'Micro-paywall platform for Solana Pay - Marketplace and Merchant Dashboard',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Solana Micro-Paywall',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana Micro-Paywall',
    description: 'Micro-paywall platform for Solana Pay - Marketplace and Merchant Dashboard',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen bg-neutral-950 text-neutral-100 relative`}>
        <BackgroundAnimation />
        <AppProviders>
          {children}
          <ToastProvider />
        </AppProviders>
      </body>
    </html>
  );
}

