import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiClient } from '../../../../../lib/api-client';
import { ContentDetail } from '../../../../../components/marketplace/content-detail';
// Note: This is a server component, so we can't use client-side logger
// Errors will be handled by Next.js error boundary

interface ContentPageProps {
  params: {
    merchantId: string;
    slug: string;
  };
}

export const runtime = 'edge'; // Required for Cloudflare Pages
// Force dynamic rendering to prevent prefetch issues on Cloudflare Pages
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable ISR to prevent prefetch cache issues

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/contents/merchant/${params.merchantId}/slug/${params.slug}`,
      {
        cache: 'no-store', // Disable caching to prevent prefetch issues
      },
    );
    
    if (!response.ok) {
      return {
        title: 'Content Not Found',
        description: 'The requested content could not be found.',
      };
    }
    
    const content = await response.json();
    
    if (content.visibility !== 'public') {
      return {
        title: 'Content Not Found',
        description: 'The requested content could not be found.',
      };
    }
    
    const title = content.title || content.slug;
    const description = content.description || `Purchase ${title} with instant Solana payments. Access premium content immediately after payment confirmation.`;
    const price = content.priceLamports ? (Number(content.priceLamports) / 1e9).toFixed(4) : '0';
    const imageUrl = content.thumbnailUrl || `${baseUrl}/og-image.svg`;
    
    return {
      title: `${title} - Premium Content`,
      description,
      keywords: [
        content.category,
        'Solana payments',
        'premium content',
        'digital content',
        content.slug,
      ].filter(Boolean),
      openGraph: {
        title: `${title} | Solana Micro-Paywall`,
        description,
        url: `${baseUrl}/marketplace/content/${params.merchantId}/${params.slug}`,
        type: 'website',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Solana Micro-Paywall`,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: `/marketplace/content/${params.merchantId}/${params.slug}`,
      },
    };
  } catch {
    return {
      title: 'Content',
      description: 'Premium content available for purchase with Solana payments.',
    };
  }
}

export default async function ContentPage({ params }: ContentPageProps) {
  // Get content by merchantId and slug using the contents API
  let content;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/contents/merchant/${params.merchantId}/slug/${params.slug}`,
      {
        next: { revalidate: 60 }, // ISR: Revalidate every 60 seconds
      },
    );
    if (!response.ok) {
      notFound();
    }
    const data = await response.json();
    // Check if content is public
    if (data.visibility !== 'public') {
      notFound();
    }
    content = data;
  } catch (error) {
    // Server-side error - will be caught by Next.js error boundary
    // In production, this should be logged to a server-side logging service
    console.error('Failed to load content:', error);
    notFound();
  }

  if (!content) {
    notFound();
  }

  return <ContentDetail content={content} />;
}


