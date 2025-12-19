import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '../components/app-providers';
import { ToastProvider } from '../components/ui/toast-provider';
import { BackgroundAnimation } from '../components/ui/background-animation';
import { NavigationHandler } from '../components/ui/navigation-handler';
import { LayoutDebugger } from '../components/ui/layout-debugger';
import { ChildrenDebugger } from '../components/ui/children-debugger';
import { NextDataInjector } from '../components/ui/next-data-injector';
import { QuirksModeChecker } from '../components/ui/quirks-mode-checker';
import { HydrationRecovery } from '../components/ui/hydration-recovery';
import { ServerHtmlCapture } from '../components/ui/server-html-capture';

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
  // #region agent log
  if (typeof window !== 'undefined') {
    // Avoid production browsers attempting localhost logging (blocked by Chrome Local Network Access)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:97',message:'RootLayout render',data:{hasChildren:!!children,pathname:window.location.pathname,childrenType:typeof children},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }
  }
  // #endregion
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
        {/* CRITICAL: Check for Quirks Mode - moved to client component to fix CSP violations */}
        {/* Inline scripts violate CSP, so we use a client component with useEffect instead */}
        <QuirksModeChecker />
        {/* CRITICAL: Next.js App Router requires a #__next root div for React hydration */}
        {/* Cloudflare Pages/@cloudflare/next-on-pages might be stripping this, so we ensure it exists */}
        <div id="__next">
          <ServerHtmlCapture />
          <BackgroundAnimation />
          <NavigationHandler />
          <LayoutDebugger />
          <NextDataInjector />
          <AppProviders>
            {/* Render children normally (server + client). */}
            {/* We previously wrapped with ClientOnly(fallback=null), which prevents the server from emitting page UI at all */}
            {/* and can result in empty RSC boundaries on Cloudflare. */}
            {children}
            <HydrationRecovery>
              {/* HydrationRecovery now just logs issues, doesn't wrap children */}
              {null}
            </HydrationRecovery>
            <ToastProvider />
          </AppProviders>
        </div>
      </body>
    </html>
  );
}

