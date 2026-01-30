import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';
const siteName = 'Micro Paywall';
const siteDescription = 'Multi-chain micro-paywall and pay-per-use platform. Monetize content with instant blockchain payments.';
const defaultImage = `${siteUrl}/og-image.png`;

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

export function generateMetadata({
  title,
  description,
  image = defaultImage,
  url,
  type = 'website',
  noindex = false,
}: SEOProps = {}): Metadata {
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const metaDescription = description || siteDescription;
  const canonicalUrl = url ? `${siteUrl}${url}` : siteUrl;

  return {
    title: fullTitle,
    description: metaDescription,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type,
      url: canonicalUrl,
      title: fullTitle,
      description: metaDescription,
      siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: metaDescription,
      images: [image],
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.svg',
      apple: '/logo.svg',
    },
    manifest: '/site.webmanifest',
  };
}

export function generateStructuredData(type: 'Organization' | 'WebSite' | 'WebPage', data?: Record<string, unknown>) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
    name: siteName,
    description: siteDescription,
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
  };

  return {
    ...baseData,
    ...data,
  };
}

