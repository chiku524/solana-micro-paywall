'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Navbar } from '@/components/navbar';
import { PaymentWidget } from '@/components/payment-widget-enhanced';
import { apiGet } from '@/lib/api';
import { formatSol } from '@/lib/utils';
import type { Content } from '@/types';

export default function ContentDetailPage() {
  const params = useParams();
  const merchantId = params.merchantId as string;
  const slug = params.slug as string;
  
  const { data: content, error } = useSWR<Content>(
    `/api/contents/merchant/${merchantId}/${slug}`,
    (url: string) => apiGet(url)
  );
  
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
    <div className="min-h-screen bg-neutral-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {content.thumbnailUrl && (
          <div className="relative w-full aspect-video bg-neutral-900 rounded-lg overflow-hidden mb-8">
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              className="w-full h-full object-cover"
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
    </div>
  );
}
