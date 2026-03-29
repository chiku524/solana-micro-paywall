'use client';

import { Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PaymentWidget } from '@/components/payment-widget-enhanced';
import { ShareButtons } from '@/components/ui/share-buttons';
import { BookmarkButton } from '@/components/ui/bookmark-button';
import { recentlyViewed } from '@/lib/local-storage';
import { apiGet, apiPost } from '@/lib/api';
import { formatAmount } from '@/lib/chains';
import { showToast } from '@/lib/toast';
import type { Content, Merchant } from '@/types';
import { getErrorMessage } from '@/lib/get-error-message';
import { useMarketplaceLocale } from '@/components/marketplace-locale-provider';

function parseRelatedIds(raw?: string): string[] {
  if (!raw) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    if (Array.isArray(j)) return j.filter((x): x is string => typeof x === 'string');
  } catch {
    /* ignore */
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function ContentDetailContent() {
  const { t, locale, setLocale } = useMarketplaceLocale();
  const searchParams = useSearchParams();
  const merchantIdParam = searchParams.get('merchantId');
  const slug = searchParams.get('slug');
  const { publicKey } = useWallet();
  const { address } = useAccount();

  const walletForUnlock = publicKey?.toBase58() ?? address ?? '';
  const contentPath =
    merchantIdParam && slug
      ? `/api/contents/merchant/${merchantIdParam}/${slug}${
          walletForUnlock ? `?wallet=${encodeURIComponent(walletForUnlock)}` : ''
        }`
      : null;

  const { data: content, error, mutate } = useSWR<Content>(
    contentPath,
    (url: string) => apiGet<Content>(url)
  );

  const { data: merchant } = useSWR<Merchant>(
    content?.merchantId ? `/api/merchants/${content.merchantId}` : null,
    (url: string) => apiGet<Merchant>(url)
  );

  const relatedIds = useMemo(() => parseRelatedIds(content?.relatedContentIds), [content?.relatedContentIds]);

  const { data: relatedContents } = useSWR<Content[]>(
    relatedIds.length ? ['related', relatedIds.join(',')] : null,
    async () => {
      const items = await Promise.all(
        relatedIds.map((id) => apiGet<Content>(`/api/contents/${id}`).catch(() => null))
      );
      return items.filter((c): c is Content => c !== null);
    }
  );

  useEffect(() => {
    if (!content?.id) return;
    void apiPost('/api/analytics/events', {
      eventType: 'content_impression',
      contentId: content.id,
    }).catch(() => {});
  }, [content?.id]);

  useEffect(() => {
    if (!content) return;
    const id = requestAnimationFrame(() => {
      try {
        window.parent?.postMessage(
          { type: 'micropaywall:resize', height: document.documentElement.scrollHeight },
          '*'
        );
      } catch {
        /* ignore */
      }
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- embed resize only when content id changes
  }, [content?.id]);

  useEffect(() => {
    if (content) {
      recentlyViewed.add(content.id, {
        title: content.title,
        thumbnailUrl: content.thumbnailUrl ?? undefined,
        merchantId: content.merchantId,
        slug: content.slug,
      });
    }
  }, [content]);

  if (!merchantIdParam || !slug) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-red-400">{t('invalidUrl')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-red-400">{t('notFound')}</p>
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

  const supportEmail = merchant?.supportContactEmail || undefined;
  const fiatLabel =
    content.targetPriceUsd != null && content.targetPriceUsd > 0
      ? `≈ $${content.targetPriceUsd.toFixed(2)} USD (charged in crypto at checkout)`
      : content.displayPriceUsd != null && content.displayPriceUsd > 0
        ? `≈ $${content.displayPriceUsd.toFixed(2)} USD reference`
        : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex flex-wrap items-center justify-end gap-2 mb-4 text-sm">
          <label className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <span>{t('localeLabel')}</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'en' | 'es')}
              className="rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 py-1"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </label>
        </div>

        <nav className="mb-6 text-sm text-neutral-600 dark:text-neutral-400" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href="/marketplace"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                {t('marketplace')}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={`/marketplace/merchant/?merchantId=${encodeURIComponent(content.merchantId)}`}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                {t('creator')}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li
              className="text-neutral-900 dark:text-white font-medium truncate max-w-[12rem] sm:max-w-none"
              aria-current="page"
            >
              {content.title}
            </li>
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
            href={`/marketplace/merchant/?merchantId=${encodeURIComponent(content.merchantId)}`}
            className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
          >
            {t('viewCreator')}
          </Link>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatAmount(content.chain ?? 'solana', content.priceLamports)}
          </span>
          {fiatLabel && (
            <span className="text-sm text-neutral-600 dark:text-neutral-400">{fiatLabel}</span>
          )}
          {content.purchaseCount > 0 && (
            <span className="text-neutral-600 dark:text-neutral-400">
              {content.purchaseCount} {content.purchaseCount !== 1 ? t('purchases') : t('purchase')}
            </span>
          )}
        </div>

        {content.description && (
          <div className="mb-6">
            {content.descriptionTruncated && (
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">{t('truncatedHint')}</p>
            )}
            <p className="text-lg text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {content.description}
            </p>
          </div>
        )}

        {(merchant?.refundPolicyText || supportEmail) && (
          <section className="mb-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/40 p-5">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">{t('refundTitle')}</h2>
            {merchant?.refundPolicyText && (
              <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap text-sm mb-3">
                {merchant.refundPolicyText}
              </p>
            )}
            {supportEmail && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <a href={`mailto:${supportEmail}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  {supportEmail}
                </a>
              </p>
            )}
          </section>
        )}

        <div className="mb-8">
          <ShareButtons
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={content.title}
            description={content.description}
          />
        </div>

        {content.previewText && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-xl mb-8 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">{t('preview')}</h2>
            <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">{content.previewText}</p>
          </div>
        )}

        {relatedContents && relatedContents.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">{t('relatedTitle')}</h2>
            <ul className="space-y-3">
              {relatedContents.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/marketplace/content/?merchantId=${encodeURIComponent(item.merchantId)}&slug=${encodeURIComponent(item.slug)}`}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    {item.title}
                  </Link>
                  <span className="text-neutral-500 dark:text-neutral-400 text-sm ml-2">
                    {formatAmount(item.chain ?? 'solana', item.priceLamports)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
          <PaymentWidget
            merchantId={content.merchantId}
            contentId={content.id}
            contentTitle={content.title}
            priceLamports={content.priceLamports}
            chain={content.chain ?? 'solana'}
            onPaymentSuccess={() => {
              showToast.success('Payment successful! You now have access.');
              void mutate();
            }}
            onPaymentError={(err) => {
              showToast.error(getErrorMessage(err, 'Payment failed. Please try again.'));
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
    <Suspense
      fallback={
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
      }
    >
      <ContentDetailContent />
    </Suspense>
  );
}
