import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SolanaWalletProvider } from '@/lib/wallet-provider';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { SWRProvider } from '@/lib/swr-config';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { ToastProvider } from '@/components/toast-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { SkipLink } from '@/components/accessibility-skip-link';
import { generateMetadata as generateSEOMetadata, generateStructuredData } from '@/lib/seo';
import { WebVitalsScript } from '@/components/web-vitals-script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = generateSEOMetadata({
  title: 'Micro Paywall - Blockchain Payment Platform',
  description: 'Multi-chain micro-paywall and pay-per-use platform. Monetize content with instant blockchain payments.',
  url: '/',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = generateStructuredData('Organization', {
    '@type': 'Organization',
    name: 'Micro Paywall',
    url: 'https://micropaywall.app',
    logo: 'https://micropaywall.app/logo.svg',
    sameAs: [
      'https://twitter.com',
      'https://github.com',
      'https://discord.com',
    ],
  });

  const websiteSchema = generateStructuredData('WebSite', {
    '@type': 'WebSite',
    name: 'Micro Paywall',
    url: 'https://micropaywall.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://micropaywall.app/marketplace?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={inter.className}>
        <SkipLink />
        <WebVitalsScript />
        <ErrorBoundary>
          <ThemeProvider>
            <SWRProvider>
              <SolanaWalletProvider>
                <AuthProvider>
                  <ToastProvider />
                  <AnimatedBackground />
                  {children}
                </AuthProvider>
              </SolanaWalletProvider>
            </SWRProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
