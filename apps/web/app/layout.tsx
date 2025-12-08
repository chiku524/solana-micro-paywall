import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '../components/app-providers';
import { ToastProvider } from '../components/ui/toast-provider';
import { BackgroundAnimation } from '../components/ui/background-animation';
import { ErrorBoundary } from '../components/ui/error-boundary';
import { DisablePrefetch } from '../components/ui/disable-prefetch';
import { RouteDebugger } from '../components/ui/route-debugger';
import { PageDebugger } from '../components/ui/page-debugger';
import { NavigationWrapper } from '../components/ui/navigation-wrapper';

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
    <html lang="en" className="h-full">
      <head>
        {/* Prevent browsers from speculatively prefetching links */}
        <meta name="speculation-rules" content='{"prefetch": {"where": []}}' />
        {/* CRITICAL: Disable Cloudflare Rocket Loader - it breaks React hydration */}
        {/* Rocket Loader defers JavaScript execution which causes React hydration mismatches */}
        {/* This script must run BEFORE any other scripts to prevent Rocket Loader from activating */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Disable Rocket Loader before it can activate
                window.rocketloader = false;
                if (typeof window.$ !== 'undefined' && window.$) {
                  window.$.rocketloader = false;
                }
                // Prevent Rocket Loader from wrapping scripts
                if (typeof window._cf !== 'undefined') {
                  window._cf.rocketloader = false;
                }
                // Set flag early to prevent Rocket Loader initialization
                window.__cf_rocketloader_disabled = true;
                
                // CRITICAL: Ensure body is ready for React hydration
                // Next.js App Router mounts React directly to body, so we need to ensure
                // the body structure is correct before React tries to hydrate
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function() {
                    console.log('[Layout] DOM ready, body children:', document.body.children.length);
                  });
                } else {
                  console.log('[Layout] DOM already ready, body children:', document.body.children.length);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-neutral-950 text-neutral-100 relative`} data-cfasync="false">
        <ErrorBoundary>
          <BackgroundAnimation />
          <AppProviders>
            <PageDebugger />
            <RouteDebugger />
            <DisablePrefetch />
            <NavigationWrapper>
              {children}
            </NavigationWrapper>
            <ToastProvider />
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}

