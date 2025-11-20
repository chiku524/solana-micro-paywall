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

export const revalidate = 60; // ISR: Revalidate every 60 seconds

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


