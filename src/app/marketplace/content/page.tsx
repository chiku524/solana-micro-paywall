'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PaymentWidget } from '@/components/payment-widget-enhanced';
import { ShareButtons } from '@/components/ui/share-buttons';
import { BookmarkButton } from '@/components/ui/bookmark-button';
import { recentlyViewed } from '@/lib/local-storage';
import { apiGet } from '@/lib/api';
import { formatSol } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import type { Content } from '@/types';
import { getErrorMessage } from '@/lib/get-error-message';

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
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-red-400">Invalid content URL</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-red-400">Content not found</p>
        </div>
      </div>
    );
  }
  
  if (!content) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="bg-neutral-200 dark:bg-neutral-900 h-96 rounded-lg mb-6" />
            <div className="bg-neutral-200 dark:bg-neutral-900 h-8 w-1/2 rounded-lg mb-4" />
            <div className="bg-neutral-200 dark:bg-neutral-900 h-4 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Track recently viewed (client-only)
  useEffect(() => {
    recentlyViewed.add(content.id, {
      title: content.title,
      thumbnailUrl: content.thumbnailUrl ?? undefined,
      merchantId: content.merchantId,
      slug: content.slug,
    });
  }, [content.id, content.title, content.thumbnailUrl, content.merchantId, content.slug]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-neutral-600 dark:text-neutral-400" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/marketplace" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Marketplace</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={`/marketplace/merchant/${content.merchantId}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Creator</Link></li>
            <li aria-hidden>/</li>
            <li className="text-neutral-900 dark:text-white font-medium truncate max-w-[12rem] sm:max-w-none" aria-current="page">{content.title}</li>
          </ol>
        </nav>
        {content.thumbnailUrl && (
          <div className="relative w-full aspect-video bg-neutral-200 dark:bg-neutral-900 rounded-lg overflow-hidden mb-8">
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
        
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white flex-1">{content.title}</h1>
          <div className="flex items-center gap-2">
            <BookmarkButton
              contentId={content.id}
              contentData={{
                title: content.title,
                thumbnailUrl: content.thumbnailUrl,
                merchantId: content.merchantId,
                slug: content.slug,
              }}
              variant="icon-only"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Link
            href={`/marketplace/merchant/${content.merchantId}`}
            className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
          >
            View creator profile →
          </Link>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatSol(content.priceLamports)} SOL
          </span>
          {content.purchaseCount > 0 && (
            <span className="text-neutral-600 dark:text-neutral-400">
              {content.purchaseCount} purchases
            </span>
          )}
        </div>
        
        {content.description && (
          <p className="text-lg text-neutral-300 mb-6">{content.description}</p>
        )}

        {/* Share Buttons */}
        <div className="mb-8">
          <ShareButtons
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={content.title}
            description={content.description}
          />
        </div>
        
        {content.previewText && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-xl mb-8 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Preview</h2>
            <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">{content.previewText}</p>
          </div>
        )}
        
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
          <PaymentWidget
            merchantId={content.merchantId}
            contentId={content.id}
            priceLamports={content.priceLamports}
            onPaymentSuccess={(token) => {
              showToast.success('Payment successful! You now have access.');
              void token;
            }}
            onPaymentError={(error) => {
              showToast.error(getErrorMessage(error, 'Payment failed. Please try again.'));
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
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="bg-neutral-200 dark:bg-neutral-900 h-96 rounded-lg mb-6" />
            <div className="bg-neutral-200 dark:bg-neutral-900 h-8 w-1/2 rounded-lg mb-4" />
            <div className="bg-neutral-200 dark:bg-neutral-900 h-4 w-full rounded-lg" />
          </div>
        </div>
      </div>
    }>
      <ContentDetailContent />
    </Suspense>
  );
}
