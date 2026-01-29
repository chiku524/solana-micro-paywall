'use client';

import { useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import useSWR from 'swr';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ContentCard } from '@/components/content-card';
import { EmptyPurchases, EmptyContent } from '@/components/ui/empty-state';
import { bookmarks, recentlyViewed } from '@/lib/local-storage';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatSol, formatDate } from '@/lib/utils';
import type { Purchase, Content } from '@/types';
import Link from 'next/link';

type TabType = 'purchases' | 'creations' | 'bookmarks' | 'recently-viewed';

export default function LibraryPage() {
  const { publicKey, connected } = useWallet();
  const { isAuthenticated, token } = useAuth();
  const walletAddress = publicKey?.toBase58() || '';
  const [activeTab, setActiveTab] = useState<TabType>('purchases');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [groupBy, setGroupBy] = useState<'merchant' | 'date'>('date');
  
  // Purchases data
  const { data: purchasesData, isLoading: purchasesLoading } = useSWR<{ purchases: Purchase[] }>(
    walletAddress && activeTab === 'purchases' ? `/api/purchases/wallet/${walletAddress}` : null,
    walletAddress ? (url: string) => apiGet<{ purchases: Purchase[] }>(url) : null
  );
  
  // Creations data (merchant's own content)
  const { data: creationsData, isLoading: creationsLoading } = useSWR<{ contents: Content[] }>(
    isAuthenticated && token && activeTab === 'creations' ? ['/api/contents', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );
  
  // Fetch content details for each purchase
  const purchaseIds = useMemo(() => 
    purchasesData?.purchases.map(p => p.contentId) || [], 
    [purchasesData]
  );
  
  const { data: contentsData } = useSWR<Record<string, Content>>(
    purchaseIds.length > 0 && activeTab === 'purchases' ? ['contents', purchaseIds] : null,
    async () => {
      const contents: Record<string, Content> = {};
      await Promise.all(
        purchaseIds.map(async (contentId) => {
          try {
            const content = await apiGet<Content>(`/api/contents/${contentId}`);
            contents[contentId] = content;
          } catch (e) {
            console.error(`Failed to fetch content ${contentId}:`, e);
          }
        })
      );
      return contents;
    }
  );
  
  const filteredPurchases = useMemo(() => {
    if (!purchasesData?.purchases) return [];
    
    const now = Math.floor(Date.now() / 1000);
    return purchasesData.purchases.filter(purchase => {
      if (filter === 'active') {
        return !purchase.expiresAt || purchase.expiresAt > now;
      }
      if (filter === 'expired') {
        return purchase.expiresAt && purchase.expiresAt <= now;
      }
      return true;
    });
  }, [purchasesData, filter]);
  
  const groupedPurchases = useMemo(() => {
    if (groupBy === 'merchant') {
      const groups: Record<string, Purchase[]> = {};
      filteredPurchases.forEach(purchase => {
        const content = contentsData?.[purchase.contentId];
        const merchantId = content?.merchantId || 'unknown';
        if (!groups[merchantId]) groups[merchantId] = [];
        groups[merchantId].push(purchase);
      });
      return groups;
    } else {
      const groups: Record<string, Purchase[]> = {};
      filteredPurchases.forEach(purchase => {
        const date = new Date(purchase.confirmedAt * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(purchase);
      });
      return groups;
    }
  }, [filteredPurchases, groupBy, contentsData]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">My Library</h1>
            <p className="text-neutral-400">
              {activeTab === 'purchases' 
                ? 'Access all your purchased content in one place'
                : 'Manage and view all your created content'}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            {activeTab === 'purchases' && !connected ? (
              <WalletMultiButton className="!bg-gradient-primary !rounded-lg" />
            ) : activeTab === 'creations' && !isAuthenticated ? (
              <Link href="/dashboard">
                <button className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                  Sign In to View Creations
                </button>
              </Link>
            ) : activeTab === 'creations' && isAuthenticated ? (
              <Link href="/dashboard/contents">
                <button className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                  Create New Content
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'purchases'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            My Purchases
          </button>
          <button
            onClick={() => setActiveTab('creations')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'creations'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            My Creations
          </button>
        </div>
        
        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <>
            {!connected ? (
              <div className="glass-strong p-12 rounded-xl text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Connect Your Wallet</h2>
                  <p className="text-neutral-400 mb-6">
                    Connect your Solana wallet to view your purchased content library
                  </p>
                  <WalletMultiButton className="!bg-gradient-primary !rounded-lg" />
                </div>
              </div>
            ) : purchasesLoading ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-neutral-900 rounded-lg h-64 animate-pulse" />
                ))}
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="glass-strong p-12 rounded-xl text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">No Purchases Found</h2>
                  <p className="text-neutral-400 mb-6">
                    {filter === 'all' 
                      ? "You haven't purchased any content yet. Browse the marketplace to get started!"
                      : filter === 'active'
                      ? "You don't have any active purchases."
                      : "You don't have any expired purchases."}
                  </p>
                  {filter === 'all' && (
                    <Link href="/marketplace">
                      <button className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                        Browse Marketplace
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Filters and Grouping */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex gap-2">
                    {(['all', 'active', 'expired'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filter === f
                            ? 'bg-gradient-primary text-white'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {(['date', 'merchant'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGroupBy(g)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          groupBy === g
                            ? 'bg-neutral-800 text-white border border-emerald-500/50'
                            : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        Group by {g}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Purchased Content */}
                <div className="space-y-8">
                  {Object.entries(groupedPurchases).map(([groupKey, purchases]) => (
                    <div key={groupKey}>
                      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">{groupKey}</h2>
                      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {purchases.map((purchase) => {
                          const content = contentsData?.[purchase.contentId];
                          const isExpired = purchase.expiresAt && purchase.expiresAt <= Math.floor(Date.now() / 1000);
                          
                          if (!content) {
                            return (
                              <div key={purchase.id} className="glass p-6 rounded-xl">
                                <p className="text-neutral-600 dark:text-neutral-400 text-sm">Loading content...</p>
                              </div>
                            );
                          }
                          
                          return (
                            <div key={purchase.id} className="glass-strong rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all group">
                              <Link href={`/marketplace/content?merchantId=${content.merchantId}&slug=${content.slug}`}>
                                {content.thumbnailUrl && (
                                  <div className="relative w-full aspect-video bg-neutral-800 overflow-hidden">
                                    <Image
                                      src={content.thumbnailUrl}
                                      alt={content.title}
                                      fill
                                      className="object-cover group-hover:scale-105 transition-transform"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                      loading="lazy"
                                    />
                                    {isExpired && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                        <span className="text-red-400 font-semibold">Expired</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="p-4">
                                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {content.title}
                                  </h3>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className={`px-2 py-1 rounded ${isExpired ? 'bg-red-900/20 text-red-400' : 'bg-emerald-900/20 text-emerald-400'}`}>
                                      {isExpired ? 'Expired' : 'Active'}
                                    </span>
                                    <span className="text-neutral-400">
                                      {formatDate(purchase.confirmedAt)}
                                    </span>
                                  </div>
                                  {purchase.expiresAt && !isExpired && (
                                    <p className="text-xs text-neutral-500 mt-2">
                                      Expires: {formatDate(purchase.expiresAt)}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        
        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <>
            {(() => {
              const bookmarkedItems = bookmarks.getAll();
              return bookmarkedItems.length > 0 ? (
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {bookmarkedItems.map((item) => (
                    <div key={item.id} className="glass-strong rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all group">
                      <Link href={`/marketplace/content?merchantId=${item.merchantId}&slug=${item.slug}`}>
                        {item.thumbnailUrl && (
                          <div className="relative w-full aspect-video bg-neutral-800 overflow-hidden">
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.title || 'Bookmarked content'}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {item.title || 'Untitled'}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            Bookmarked {formatDate(item.bookmarkedAt)}
                          </p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-strong p-12 rounded-xl text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No Bookmarks Yet</h2>
                    <p className="text-neutral-400 mb-6">
                      Content you bookmark will appear here. Start exploring to find interesting content!
                    </p>
                    <Link href="/marketplace">
                      <button className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                        Browse Marketplace
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Recently Viewed Tab */}
        {activeTab === 'recently-viewed' && (
          <>
            {(() => {
              const recentlyViewedItems = recentlyViewed.getAll();
              return recentlyViewedItems.length > 0 ? (
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {recentlyViewedItems.map((item) => (
                    <div key={item.id} className="glass-strong rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all group">
                      <Link href={`/marketplace/content?merchantId=${item.merchantId}&slug=${item.slug}`}>
                        {item.thumbnailUrl && (
                          <div className="relative w-full aspect-video bg-neutral-800 overflow-hidden">
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.title || 'Recently viewed content'}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {item.title || 'Untitled'}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            Viewed {formatDate(item.viewedAt)}
                          </p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-strong p-12 rounded-xl text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">No Recent Views</h2>
                    <p className="text-neutral-400 mb-6">
                      Content you view will appear here. Start browsing to build your history!
                    </p>
                    <Link href="/marketplace">
                      <button className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                        Browse Marketplace
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Creations Tab */}
        {activeTab === 'creations' && (
          <>
            {!isAuthenticated ? (
              <div className="glass-strong p-12 rounded-xl text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Sign In Required</h2>
                  <p className="text-neutral-400 mb-6">
                    Sign in to your merchant account to view and manage your created content
                  </p>
                  <Link href="/dashboard">
                    <button className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                      Sign In
                    </button>
                  </Link>
                </div>
              </div>
            ) : creationsLoading ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-neutral-900 rounded-lg h-64 animate-pulse" />
                ))}
              </div>
            ) : creationsData?.contents && creationsData.contents.length > 0 ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                {creationsData.contents.map((content) => (
                  <div key={content.id} className="glass-strong rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all group">
                    <Link href={`/marketplace/content?merchantId=${content.merchantId}&slug=${content.slug}`}>
                      {content.thumbnailUrl && (
                        <div className="relative w-full aspect-video bg-neutral-800 overflow-hidden">
                          <Image
                            src={content.thumbnailUrl}
                            alt={content.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {content.title}
                        </h3>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {formatSol(content.priceLamports)} SOL
                          </span>
                          <span className="text-neutral-400">
                            {content.purchaseCount || 0} purchases
                          </span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Link href={`/dashboard/contents`} onClick={(e) => e.stopPropagation()}>
                            <button className="text-xs px-3 py-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded transition-colors">
                              Manage
                            </button>
                          </Link>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-strong p-12 rounded-xl text-center">
                <div className="max-w-md mx-auto">
                  <EmptyContent />
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
