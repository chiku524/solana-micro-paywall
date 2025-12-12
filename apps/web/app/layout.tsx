import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '../components/app-providers';
import { ToastProvider } from '../components/ui/toast-provider';
import { BackgroundAnimation } from '../components/ui/background-animation';
import { NavigationHandler } from '../components/ui/navigation-handler';

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
        {/* CRITICAL: Check for Quirks Mode IMMEDIATELY before React hydration */}
        {/* This script must run synchronously and block rendering if Quirks Mode is detected */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // CRITICAL: Check for Quirks Mode immediately
                // If DOCTYPE is missing, the browser enters Quirks Mode before any scripts run
                // This check happens as early as possible to prevent React hydration errors
                if (typeof document !== 'undefined' && document.compatMode === 'BackCompat') {
                  console.error('[Layout] CRITICAL: Page is in Quirks Mode! DOCTYPE is missing. Forcing immediate page reload.');
                  // Force a full page reload IMMEDIATELY - don't wait for React
                  // Use replace to avoid adding to history stack
                  if (window.location.search.indexOf('_quirks_fix') === -1) {
                    window.location.replace(window.location.href + (window.location.search ? '&' : '?') + '_quirks_fix=1');
                    // Stop execution - don't let React try to hydrate
                    throw new Error('Quirks Mode detected - reloading page');
                  } else {
                    // If we're already in a reload loop, something is seriously wrong
                    console.error('[Layout] CRITICAL: Still in Quirks Mode after reload attempt. DOCTYPE injection may be required.');
                  }
                }
                
                // Disable Cloudflare Rocket Loader immediately
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
        <BackgroundAnimation />
        <NavigationHandler />
        <AppProviders>
          {children}
          <ToastProvider />
        </AppProviders>
      </body>
    </html>
  );
}

