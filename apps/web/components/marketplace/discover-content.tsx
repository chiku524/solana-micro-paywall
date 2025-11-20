'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient, Content } from '../../lib/api-client';
import { ContentCard } from './content-card';
import { SkeletonCard } from '../ui/skeleton';
import { debounce } from '../../lib/utils/debounce';
import { logger } from '../../lib/logger';
import { SearchAutocomplete } from './search-autocomplete';

export function DiscoverContent() {
  const searchParams = useSearchParams();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    sort: (searchParams.get('sort') as any) || 'newest',
    currency: searchParams.get('currency') || '',
  });

  const loadContents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.discoverContents({
        ...filters,
        page,
        limit: 20,
      });
      setContents(response.contents);
      setTotal(response.total);
    } catch (error) {
      logger.error('Failed to load contents', error instanceof Error ? error : new Error(String(error)), {
        filters,
        page,
      });
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  // Debounced search handler
  const debouncedLoadContents = useCallback(
    debounce(() => {
      setPage(1); // Reset to first page on search
      loadContents();
    }, 500),
    [loadContents]
  );

  useEffect(() => {
    loadContents();
  }, [page]);

  // Debounce filter changes (search, category, sort)
  useEffect(() => {
    if (page === 1) {
      debouncedLoadContents();
    } else {
      loadContents();
    }
  }, [filters.search, filters.category, filters.sort, filters.currency]);

  if (loading && contents.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Filters</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">Search</label>
            <SearchAutocomplete
              value={filters.search}
              onChange={(value) => setFilters({ ...filters, search: value })}
              placeholder="Search content..."
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">Category</label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              placeholder="Category..."
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">Sort By</label>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value as any })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">Currency</label>
            <select
              value={filters.currency}
              onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
            >
              <option value="">All</option>
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
              <option value="PYUSD">PYUSD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-neutral-400">
          Found {total} content{total !== 1 ? 's' : ''}
        </p>
      </div>

      {contents.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-12 text-center">
          <p className="text-neutral-400">No content found. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {contents.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-neutral-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-neutral-400">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-neutral-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


