'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { apiClient } from '../../lib/api-client';
import { ContentCard } from '../../components/marketplace/content-card';
import { HeartIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function BookmarksPageContent() {
  const { publicKey, connected } = useWallet();
  const searchParams = useSearchParams();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBookmarks();
  }, [publicKey, connected]);

  const loadBookmarks = async () => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const walletAddress = publicKey.toString();
      const response = await apiClient.getBookmarks(walletAddress, { limit: 100 }) as any;

      if (response && response.bookmarks) {
        setBookmarks(response.bookmarks.map((b: any) => b.content));
      } else {
        setBookmarks([]);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookmarks = bookmarks.filter((content) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      content.title?.toLowerCase().includes(query) ||
      content.slug.toLowerCase().includes(query) ||
      content.description?.toLowerCase().includes(query) ||
      content.category?.toLowerCase().includes(query)
    );
  });

  if (!connected) {
    return (
      <div className="min-h-screen relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <HeartIcon className="mx-auto h-16 w-16 text-neutral-600 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-neutral-400 mb-6">
              Connect your Solana wallet to view your bookmarked content.
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
            <p className="mt-4 text-neutral-400">Loading your bookmarks...</p>
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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">My Bookmarks</h1>
          <p className="text-neutral-400">
            Content you've saved for later
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search your bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-800 bg-neutral-900/50 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Bookmarks Grid */}
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-16">
            <HeartIcon className="mx-auto h-16 w-16 text-neutral-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'No bookmarks found' : 'Your bookmarks are empty'}
            </h3>
            <p className="text-neutral-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Start bookmarking content from the marketplace to save them for later'}
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
            {filteredBookmarks.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookmarksPage() {
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
      <BookmarksPageContent />
    </Suspense>
  );
}

