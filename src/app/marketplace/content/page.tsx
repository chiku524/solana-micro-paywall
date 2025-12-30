'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PaymentWidget } from '@/components/payment-widget-enhanced';
import { apiGet } from '@/lib/api';
import { formatSol } from '@/lib/utils';
import type { Content } from '@/types';

function ContentDetailContent() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get('merchantId');
  const slug = searchParams.get('slug');
  
  const { data: content, error } = useSWR<Content>(
    merchantId && slug ? `/api/contents/merchant/${merchantId}/${slug}` : null,
    (url: string) => apiGet<Content>(url)
  );
  
  if (!merchantId || !slug) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-red-400">Invalid content URL</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-red-400">Content not found</p>
        </div>
      </div>
    );
  }
  
  if (!content) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="bg-neutral-900 h-96 rounded-lg mb-6" />
            <div className="bg-neutral-900 h-8 w-1/2 rounded-lg mb-4" />
            <div className="bg-neutral-900 h-4 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {content.thumbnailUrl && (
          <div className="relative w-full aspect-video bg-neutral-900 rounded-lg overflow-hidden mb-8">
            <Image
              src={content.thumbnailUrl}
              alt={content.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
              priority
            />
          </div>
        )}
        
        <h1 className="text-4xl font-bold text-white mb-4">{content.title}</h1>
        
        <div className="flex items-center gap-4 mb-6">
          <span className="text-2xl font-bold text-emerald-400">
            {formatSol(content.priceLamports)} SOL
          </span>
          {content.purchaseCount > 0 && (
            <span className="text-neutral-400">
              {content.purchaseCount} purchases
            </span>
          )}
        </div>
        
        {content.description && (
          <p className="text-lg text-neutral-300 mb-8">{content.description}</p>
        )}
        
        {content.previewText && (
          <div className="bg-neutral-900 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-white mb-3">Preview</h2>
            <p className="text-neutral-300 whitespace-pre-wrap">{content.previewText}</p>
          </div>
        )}
        
        <div className="border-t border-neutral-800 pt-8">
          <PaymentWidget
            merchantId={content.merchantId}
            contentId={content.id}
            priceLamports={content.priceLamports}
            onPaymentSuccess={(token) => {
              alert('Payment successful! Access token: ' + token);
              // Redirect or unlock content here
            }}
            onPaymentError={(error) => {
              console.error('Payment error:', error);
            }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ContentDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="bg-neutral-900 h-96 rounded-lg mb-6" />
            <div className="bg-neutral-900 h-8 w-1/2 rounded-lg mb-4" />
            <div className="bg-neutral-900 h-4 w-full rounded-lg" />
          </div>
        </div>
      </div>
    }>
      <ContentDetailContent />
    </Suspense>
  );
}
