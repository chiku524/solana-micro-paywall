import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '../../../../lib/api-client';
import { ContentCard } from '../../../../components/marketplace/content-card';
import { FollowButton } from '../../../../components/marketplace/follow-button';
import { RecommendationsSection } from '../../../../components/marketplace/recommendations-section';
import { 
  UserIcon, 
  GlobeAltIcon, 
  ChartBarIcon,
  UsersIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { 
  EnvelopeIcon,
  LinkIcon,
  CodeBracketIcon
} from '@heroicons/react/24/solid';

interface MerchantProfilePageProps {
  params: {
    merchantId: string;
  };
}

export const runtime = 'edge'; // Required for Cloudflare Pages
export const revalidate = 60; // ISR: Revalidate every 60 seconds

const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://micropaywall.app';

export async function generateMetadata({ params }: MerchantProfilePageProps): Promise<Metadata> {
  try {
    const profile = await apiClient.getMerchantPublicProfile(params.merchantId);
    const merchantContents = await apiClient.getMerchantContents(params.merchantId, { limit: 1 });
    
    const merchant: {
      displayName?: string;
      email?: string;
      bio?: string;
      avatarUrl?: string;
    } = profile || {
      email: merchantContents.contents[0]?.merchant?.email || 'Merchant',
    };
    
    const displayName = merchant.displayName || merchant.email || 'Merchant';
    const bio = merchant.bio || `Browse premium content from ${displayName} on Solana Micro-Paywall.`;
    
    return {
      title: `${displayName} - Merchant Profile`,
      description: bio,
      keywords: [
        displayName,
        'Solana merchant',
        'content creator',
        'premium content',
        'Solana payments',
      ],
      openGraph: {
        title: `${displayName} | Solana Micro-Paywall`,
        description: bio,
        url: `${baseUrl}/marketplace/merchant/${params.merchantId}`,
        type: 'profile',
        images: [
          {
            url: merchant.avatarUrl || `${baseUrl}/og-image.svg`,
            width: 1200,
            height: 630,
            alt: displayName,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${displayName} | Solana Micro-Paywall`,
        description: bio,
        images: [merchant.avatarUrl || `${baseUrl}/og-image.svg`],
      },
      alternates: {
        canonical: `/marketplace/merchant/${params.merchantId}`,
      },
    };
  } catch {
    return {
      title: 'Merchant Profile',
      description: 'View merchant profile and browse their premium content on Solana Micro-Paywall.',
    };
  }
}

export default async function MerchantProfilePage({ params }: MerchantProfilePageProps) {
  let merchant: any;
  let contents;
  let profile: any;

  try {
    // Fetch merchant public profile with stats
    try {
      profile = await apiClient.getMerchantPublicProfile(params.merchantId);
    } catch (error) {
      console.error('Error loading merchant profile:', error);
    }

    // Fetch merchant contents
    const merchantContents = await apiClient.getMerchantContents(params.merchantId, { limit: 100 });
    contents = merchantContents.contents || [];

    merchant = profile || {
      id: params.merchantId,
      email: contents[0]?.merchant?.email || 'Unknown Merchant',
      displayName: contents[0]?.merchant?.email || 'Unknown Merchant',
    };
  } catch (error) {
    console.error('Error loading merchant profile:', error);
    notFound();
  }

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/marketplace" className="text-xl sm:text-2xl font-bold text-white">
              Solana Paywall Marketplace
            </Link>
            <nav className="hidden md:flex md:items-center md:space-x-4 lg:space-x-6">
              <Link href="/marketplace/discover" className="text-sm lg:text-base text-neutral-300 hover:text-white">
                Discover
              </Link>
              <Link href="/library" className="text-sm lg:text-base text-neutral-300 hover:text-white">
                My Library
              </Link>
              <Link href="/docs" className="text-sm lg:text-base text-neutral-300 hover:text-white">
                Documentation
              </Link>
              <Link href="/dashboard" className="text-sm lg:text-base text-emerald-400 hover:text-emerald-300">
                For Merchants
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Merchant Profile Header */}
        <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-8">
          <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {merchant.avatarUrl ? (
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-emerald-500/50">
                  <Image
                    src={merchant.avatarUrl}
                    alt={merchant.displayName || merchant.email}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border-2 border-emerald-500/50">
                  <UserIcon className="h-12 w-12 text-emerald-400" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {merchant.displayName || merchant.email}
                  </h1>
                  {merchant.bio && (
                    <p className="text-neutral-300 mb-4 max-w-2xl">{merchant.bio}</p>
                  )}
                  
                  {/* Social Links */}
                  {(merchant.websiteUrl || merchant.twitterUrl || merchant.telegramUrl || merchant.discordUrl || merchant.githubUrl) && (
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {merchant.websiteUrl && (
                        <a
                          href={merchant.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm text-neutral-400 hover:text-emerald-400 transition"
                        >
                          <LinkIcon className="h-4 w-4" />
                          <span>Website</span>
                        </a>
                      )}
                      {merchant.twitterUrl && (
                        <a
                          href={merchant.twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm text-neutral-400 hover:text-emerald-400 transition"
                        >
                          <span>🐦</span>
                          <span>Twitter</span>
                        </a>
                      )}
                      {merchant.telegramUrl && (
                        <a
                          href={merchant.telegramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm text-neutral-400 hover:text-emerald-400 transition"
                        >
                          <span>✈️</span>
                          <span>Telegram</span>
                        </a>
                      )}
                      {merchant.discordUrl && (
                        <a
                          href={merchant.discordUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm text-neutral-400 hover:text-emerald-400 transition"
                        >
                          <span>💬</span>
                          <span>Discord</span>
                        </a>
                      )}
                      {merchant.githubUrl && (
                        <a
                          href={merchant.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm text-neutral-400 hover:text-emerald-400 transition"
                        >
                          <CodeBracketIcon className="h-4 w-4" />
                          <span>GitHub</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <FollowButton merchantId={merchant.id} />
              </div>

              {/* Stats */}
              {merchant.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <ChartBarIcon className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm text-neutral-400">Content</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{merchant.stats.totalContent || contents.length}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <UsersIcon className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm text-neutral-400">Followers</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{merchant.stats.totalFollowers || 0}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <ShoppingBagIcon className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm text-neutral-400">Sales</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{merchant.stats.totalSales || 0}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <CurrencyDollarIcon className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm text-neutral-400">Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {merchant.stats.totalRevenue 
                        ? (Number(merchant.stats.totalRevenue) / 1e9).toFixed(2) 
                        : '0.00'} SOL
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {contents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-400">This merchant hasn't published any content yet.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">All Content</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {contents.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          </>
        )}

        {/* Recommendations */}
        <RecommendationsSection limit={4} />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-800 bg-neutral-900/60 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-neutral-400 sm:px-6 lg:px-8">
          <p>Powered by Solana Micro-Paywall</p>
        </div>
      </footer>
    </div>
  );
}

