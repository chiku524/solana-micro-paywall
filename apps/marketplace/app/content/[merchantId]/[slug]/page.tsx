import { notFound } from 'next/navigation';
import { marketplaceApi } from '../../../../lib/api-client';
import { ContentDetail } from '../../../../components/content-detail';

interface ContentPageProps {
  params: {
    merchantId: string;
    slug: string;
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  // Get content by merchantId and slug using the contents API
  let content;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/contents/merchant/${params.merchantId}/slug/${params.slug}`,
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
    console.error('Failed to load content:', error);
    notFound();
  }

  if (!content) {
    notFound();
  }

  return <ContentDetail content={content} />;
}

