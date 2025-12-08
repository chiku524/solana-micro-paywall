import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '../components/app-providers';
import { ToastProvider } from '../components/ui/toast-provider';
import { BackgroundAnimation } from '../components/ui/background-animation';
import { ErrorBoundary } from '../components/ui/error-boundary';
import { ErrorFallback } from '../components/ui/error-fallback';

const inter = Inter({ subsets: ['latin'] });

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

export const metadata: Metadata = {
  title: {
    default: 'Solana Micro-Paywall - Monetize Content with Instant Solana Payments',
    template: '%s | Solana Micro-Paywall',
  },
  description: 'The easiest way for creators, publishers, and API providers to accept instant Solana payments and grant access to premium content. Built for the Solana ecosystem with sub-second confirmations and near-zero fees.',
  keywords: [
    'Solana',
    'Paywall',
    'Blockchain',
    'Payments',
    'Marketplace',
    'Content Monetization',
    'Solana Pay',
    'Web3',
    'Cryptocurrency Payments',
    'Digital Content',
    'Creator Economy',
    'Micropayments',
    'SOL Payments',
    'Instant Payments',
  ],
  authors: [{ name: 'Solana Micro-Paywall', url: baseUrl }],
  creator: 'Solana Micro-Paywall',
  publisher: 'Solana Micro-Paywall',
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Solana Micro-Paywall',
    title: 'Solana Micro-Paywall - Monetize Content with Instant Solana Payments',
    description: 'The easiest way for creators, publishers, and API providers to accept instant Solana payments and grant access to premium content. Built for the Solana ecosystem.',
    images: [
      {
        url: `${baseUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: 'Solana Micro-Paywall - Instant Solana Payments for Content Creators',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana Micro-Paywall - Monetize Content with Instant Solana Payments',
    description: 'The easiest way for creators to accept instant Solana payments. Sub-second confirmations, near-zero fees, global marketplace.',
    images: [`${baseUrl}/og-image.svg`],
    creator: '@solana',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
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
  verification: {
    // Add Google Search Console verification if you have it
    // google: 'your-verification-code',
  },
  category: 'Technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* CRITICAL: Ensure Standards Mode - Next.js adds DOCTYPE automatically */}
        {/* Prevent browsers from speculatively prefetching links */}
        <meta name="speculation-rules" content='{"prefetch": {"where": []}}' />
        {/* Ensure proper charset and viewport */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} min-h-screen bg-neutral-950 text-neutral-100 relative`} data-cfasync="false" suppressHydrationWarning>
        {/* CRITICAL: Ensure Standards Mode - script must run after body is created */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // CRITICAL: Ensure we're in Standards Mode
                // Check if document.compatMode is 'BackCompat' (Quirks Mode)
                if (document.compatMode === 'BackCompat') {
                  console.error('[Layout] CRITICAL: Page is in Quirks Mode! This will break React hydration.');
                  // Force a reload to get proper DOCTYPE
                  if (window.location.search.indexOf('_quirks_fix') === -1) {
                    window.location.href = window.location.href + (window.location.search ? '&' : '?') + '_quirks_fix=1';
                    return;
                  }
                }
                
                // Disable Cloudflare Rocket Loader
                if (typeof window !== 'undefined') {
                  window.rocketloader = false;
                  if (typeof window.$ !== 'undefined' && window.$) {
                    window.$.rocketloader = false;
                  }
                  if (typeof window._cf !== 'undefined') {
                    window._cf.rocketloader = false;
                  }
                  window.__cf_rocketloader_disabled = true;
                }
              })();
            `,
          }}
        />
        <ErrorBoundary fallback={<ErrorFallback />}>
          <BackgroundAnimation />
          <AppProviders>
            {children}
            <ToastProvider />
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}

