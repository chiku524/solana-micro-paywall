'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ContentCard } from '@/components/content-card';
import { apiGet } from '@/lib/api';
import type { Content } from '@/types';

type PublicMerchant = {
  id: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
  githubUrl?: string;
  createdAt: number;
};

export default function MerchantProfilePage() {
  const params = useParams();
  const merchantId = params?.merchantId as string;

  const { data: merchant, error: merchantError } = useSWR<PublicMerchant>(
    merchantId ? `/api/merchants/${merchantId}` : null,
    (url: string) => apiGet<PublicMerchant>(url)
  );

  const { data: contentData } = useSWR<{ content: Content[] }>(
    merchantId ? `/api/discover/merchant/${merchantId}` : null,
    (url: string) => apiGet<{ content: Content[] }>(url)
  );

  const contents = contentData?.content ?? [];

  if (!merchantId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-red-500">Invalid merchant</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (merchantError || (merchant === undefined && !contentData)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl w-1/3" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full max-w-2xl" />
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-neutral-600 dark:text-neutral-400">Creator not found.</p>
          <Link href="/marketplace" className="text-emerald-600 dark:text-emerald-400 hover:underline mt-4 inline-block">
            Back to Marketplace
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const socialLinks: { url: string; label: string }[] = [
    merchant.twitterUrl && { url: merchant.twitterUrl, label: 'Twitter' },
    merchant.telegramUrl && { url: merchant.telegramUrl, label: 'Telegram' },
    merchant.discordUrl && { url: merchant.discordUrl, label: 'Discord' },
    merchant.githubUrl && { url: merchant.githubUrl, label: 'GitHub' },
  ].filter(Boolean) as { url: string; label: string }[];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <nav className="mb-6 text-sm text-neutral-600 dark:text-neutral-400" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/marketplace" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Marketplace</Link></li>
            <li aria-hidden>/</li>
            <li className="text-neutral-900 dark:text-white font-medium" aria-current="page">{merchant.displayName || 'Creator'}</li>
          </ol>
        </nav>

        <section className="glass-strong rounded-xl p-6 md:p-8 mb-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {merchant.avatarUrl && (
              <div className="relative w-24 h-24 rounded-full overflow-hidden flex-shrink-0 bg-neutral-200 dark:bg-neutral-800">
                <Image
                  src={merchant.avatarUrl}
                  alt={merchant.displayName || 'Creator avatar'}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                {merchant.displayName || 'Creator'}
              </h1>
              {merchant.bio && (
                <p className="text-neutral-600 dark:text-neutral-400 mb-4 whitespace-pre-wrap">{merchant.bio}</p>
              )}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {socialLinks.map(({ url, label }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium"
                      aria-label={label}
                    >
                      {label} →
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Content</h2>
        {contents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {contents.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <div className="glass-strong p-12 rounded-xl text-center">
            <p className="text-neutral-600 dark:text-neutral-400">No public content yet.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
