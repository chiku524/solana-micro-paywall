'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { apiClient } from '../../lib/api-client';
import { 
  BookOpenIcon, 
  ClockIcon, 
  CheckCircleIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

interface PurchasedContent {
  id: string;
  slug: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  priceLamports: string;
  currency: string;
  merchant: {
    id: string;
    email: string;
  };
  purchaseDate: string;
  expiresAt?: string;
  accessToken: string;
}

export function LibraryPageContent() {
  const { publicKey, connected } = useWallet();
  const searchParams = useSearchParams();
  const [purchasedContent, setPurchasedContent] = useState<PurchasedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => {
    loadPurchasedContent();
  }, [publicKey, connected]);

  const loadPurchasedContent = async () => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const walletAddress = publicKey.toString();
      const response = await apiClient.getPurchases(walletAddress, { limit: 100 }) as any;
      
      if (response && response.purchases) {
        const purchases = response.purchases.map((p: any) => ({
          id: p.id,
          slug: p.content.slug,
          title: p.content.title,
          description: p.content.description,
          thumbnailUrl: p.content.thumbnailUrl,
          category: p.content.category,
          priceLamports: p.content.priceLamports,
          currency: p.content.currency,
          merchant: p.merchant,
          purchaseDate: p.purchasedAt,
          expiresAt: p.expiresAt,
          accessToken: p.accessToken || null,
        }));
        
        setPurchasedContent(purchases);
      } else {
        setPurchasedContent([]);
      }
    } catch (error) {
      console.error('Error loading purchased content:', error);
      // Fallback to localStorage for backward compatibility
      try {
        const allKeys = Object.keys(localStorage);
        const accessTokens: PurchasedContent[] = [];

        allKeys.forEach((key) => {
          if (key.startsWith('access_')) {
            const token = localStorage.getItem(key);
            if (token) {
              const parts = key.replace('access_', '').split('_');
              if (parts.length >= 2) {
                const slug = parts.slice(1).join('_');
                const merchantId = parts[0];
                
                try {
                  const payload = JSON.parse(atob(token.split('.')[1]));
                  const expiresAt = payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined;

                  accessTokens.push({
                    id: `${merchantId}-${slug}`,
                    slug,
                    merchant: { id: merchantId, email: '' },
                    priceLamports: '0',
                    currency: 'SOL',
                    purchaseDate: new Date().toISOString(),
                    expiresAt,
                    accessToken: token,
                  });
                } catch {
                  accessTokens.push({
                    id: `${merchantId}-${slug}`,
                    slug,
                    merchant: { id: merchantId, email: '' },
                    priceLamports: '0',
                    currency: 'SOL',
                    purchaseDate: new Date().toISOString(),
                    accessToken: token,
                  });
                }
              }
            }
          }
        });

        // Fetch content details for localStorage items
        Promise.all(
          accessTokens.map(async (item) => {
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/contents/merchant/${item.merchant.id}/slug/${item.slug}`
              );
              if (response.ok) {
                const content = await response.json();
                return {
                  ...item,
                  title: content.title,
                  description: content.description,
                  thumbnailUrl: content.thumbnailUrl,
                  category: content.category,
                  priceLamports: content.priceLamports,
                  currency: content.currency,
                };
              }
              return item;
            } catch {
              return item;
            }
          })
        ).then((contents) => {
          setPurchasedContent(contents);
          setLoading(false);
        });
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setPurchasedContent([]);
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = purchasedContent.filter((item) => {
    const matchesSearch = 
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.merchant.email.toLowerCase().includes(searchQuery.toLowerCase());

    const isExpired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false;
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && !isExpired) ||
      (filter === 'expired' && isExpired);

    return matchesSearch && matchesFilter;
  });

  if (!connected) {
    return (
      <div className="min-h-screen relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <BookOpenIcon className="mx-auto h-16 w-16 text-neutral-600 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-neutral-400 mb-6">
              Connect your Solana wallet to view your purchased content library.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
            <p className="mt-4 text-neutral-400">Loading your library...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">My Library</h1>
          <p className="text-neutral-400">
            Access all your purchased content in one place
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-800 bg-neutral-900/50 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-emerald-500 text-emerald-950'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'active'
                  ? 'bg-emerald-500 text-emerald-950'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'expired'
                  ? 'bg-emerald-500 text-emerald-950'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              Expired
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {filteredContent.length === 0 ? (
          <div className="text-center py-16">
            <BookOpenIcon className="mx-auto h-16 w-16 text-neutral-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'No content found' : 'Your library is empty'}
            </h3>
            <p className="text-neutral-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Start purchasing content from the marketplace to build your library'}
            </p>
            {!searchQuery && (
              <Link
                href="/marketplace"
                className="inline-flex items-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-emerald-950 transition hover:bg-emerald-400"
              >
                Browse Marketplace
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredContent.map((item) => {
              const isExpired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false;
              return (
                <Link
                  key={item.id}
                  href={`/marketplace/content/${item.merchant.id}/${item.slug}`}
                  className="group relative"
                >
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6 transition hover:border-emerald-500/50 hover:bg-neutral-900">
                    {isExpired && (
                      <div className="absolute top-2 right-2 rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-400">
                        Expired
                      </div>
                    )}
                    {!isExpired && (
                      <div className="absolute top-2 right-2 rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircleIcon className="h-3 w-3" />
                        Active
                      </div>
                    )}
                    <div className="mb-4">
                      {item.thumbnailUrl ? (
                        <div className="aspect-video w-full rounded-lg bg-neutral-800 overflow-hidden mb-3">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title || item.slug}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center mb-3">
                          <BookOpenIcon className="h-12 w-12 text-neutral-600" />
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                        {item.title || item.slug}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-neutral-400 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{item.merchant.email || item.merchant.id}</span>
                      {item.expiresAt && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {isExpired ? 'Expired' : `Expires ${new Date(item.expiresAt).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function LibraryPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen relative z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
            <p className="mt-4 text-neutral-400">Loading...</p>
          </div>
        </div>
      }
    >
      <LibraryPageContent />
    </Suspense>
  );
}

