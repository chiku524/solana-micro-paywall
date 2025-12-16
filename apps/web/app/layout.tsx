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
        {/* Using both inline script and data attribute to ensure it runs */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // CRITICAL: Log immediately to verify script is executing
                console.log('[Layout] Quirks Mode detection script executing...');
                console.log('[Layout] document.compatMode:', typeof document !== 'undefined' ? document.compatMode : 'document undefined');
                
                // CRITICAL: Check for Quirks Mode immediately
                // If DOCTYPE is missing, the browser enters Quirks Mode before any scripts run
                // This check happens as early as possible to prevent React hydration errors
                // #region agent log
                if (typeof document !== 'undefined') {
                  fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:126',message:'Quirks Mode check',data:{compatMode:document.compatMode,doctype:document.doctype ? 'present' : 'missing',pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                }
                // #endregion
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
                    // Try to inject DOCTYPE programmatically as last resort
                    if (document.doctype === null) {
                      console.error('[Layout] Attempting to inject DOCTYPE programmatically...');
                      // This won't work (DOCTYPE can't be added after page load), but logs the attempt
                    }
                  }
                } else {
                  console.log('[Layout] Page is in Standards Mode - DOCTYPE is present');
                }
                
                // CRITICAL: Ensure #__next root element exists for React hydration
                // Next.js App Router should create this automatically, but Cloudflare Pages might strip it
                // The middleware should ensure it exists in HTML, but this is a safety net
                if (typeof document !== 'undefined') {
                  let nextRoot = document.getElementById('__next');
                  
                  if (!nextRoot) {
                    console.error('[Layout] CRITICAL: #__next root element missing! This should have been fixed by middleware.');
                    console.error('[Layout] Body HTML:', document.body.innerHTML.substring(0, 500));
                    console.error('[Layout] Body children:', Array.from(document.body.children).map(el => ({
                      tagName: el.tagName,
                      id: el.id,
                      className: el.className,
                    })));
                    
                    // Last resort: create it (but this shouldn't be necessary if middleware works)
                    nextRoot = document.createElement('div');
                    nextRoot.id = '__next';
                    // Insert at the beginning of body
                    if (document.body.firstChild) {
                      document.body.insertBefore(nextRoot, document.body.firstChild);
                    } else {
                      document.body.appendChild(nextRoot);
                    }
                    console.error('[Layout] Created #__next as last resort - middleware should have fixed this!');
                  } else {
                    console.log('[Layout] #__next root element found');
                  }
                  
                  // CRITICAL: Check for __NEXT_DATA__ script tag and create if missing
                  // This must happen BEFORE React tries to hydrate
                  const nextDataScript = document.getElementById('__NEXT_DATA__');
                  if (!nextDataScript && typeof window !== 'undefined') {
                    console.warn('[Layout] CRITICAL: __NEXT_DATA__ script tag missing! Creating minimal version...');
                    const pathname = window.location.pathname;
                    const minimalNextData = {
                      props: { pageProps: {} },
                      page: pathname,
                      pathname: pathname,
                      query: {},
                      buildId: 'development',
                      isFallback: false,
                      gssp: true,
                      customServer: false,
                      appGip: false,
                      locale: undefined,
                      locales: undefined,
                      defaultLocale: undefined,
                      domainLocales: undefined,
                      scriptLoader: [],
                    };
                    
                    // Create script tag
                    const script = document.createElement('script');
                    script.id = '__NEXT_DATA__';
                    script.type = 'application/json';
                    script.setAttribute('data-nextjs-data', '');
                    script.textContent = JSON.stringify(minimalNextData);
                    
                    // Insert at the very beginning of body, before any other scripts
                    if (document.body.firstChild) {
                      document.body.insertBefore(script, document.body.firstChild);
                    } else {
                      document.body.appendChild(script);
                    }
                    
                    // Also set window property
                    window.__NEXT_DATA__ = minimalNextData;
                    console.log('[Layout] Created __NEXT_DATA__ script tag with pathname:', pathname);
                  } else if (nextDataScript) {
                    console.log('[Layout] __NEXT_DATA__ script tag found');
                    // Try to parse and set window property if not already set
                    if (typeof window !== 'undefined' && !window.__NEXT_DATA__) {
                      try {
                        window.__NEXT_DATA__ = JSON.parse(nextDataScript.textContent || '{}');
                        console.log('[Layout] Parsed __NEXT_DATA__ from script tag');
                      } catch (e) {
                        console.error('[Layout] Failed to parse __NEXT_DATA__:', e);
                      }
                    }
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
        {/* CRITICAL: Next.js App Router requires a #__next root div for React hydration */}
        {/* Cloudflare Pages/@cloudflare/next-on-pages might be stripping this, so we ensure it exists */}
        <div id="__next">
          <BackgroundAnimation />
          <NavigationHandler />
          <LayoutDebugger />
          <NextDataInjector />
          <AppProviders>
            <ChildrenDebugger>
              {children}
            </ChildrenDebugger>
            <ToastProvider />
          </AppProviders>
        </div>
      </body>
    </html>
  );
}

