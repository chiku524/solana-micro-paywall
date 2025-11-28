'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient, Content } from '../../lib/api-client';
import { ContentCard } from './content-card';
import { SkeletonCard } from '../ui/skeleton';
import { debounce } from '../../lib/utils/debounce';
import { logger } from '../../lib/logger';
import { SearchAutocomplete } from './search-autocomplete';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Category {
  category: string;
  count: number;
}

export function DiscoverContent() {
  const searchParams = useSearchParams();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    sort: (searchParams.get('sort') as any) || 'newest',
    currency: searchParams.get('currency') || '',
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const cats = await apiClient.getCategories();
        setCategories(cats);
      } catch (error) {
        logger.error('Failed to load categories', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  const loadContents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.discoverContents({
        ...filters,
        minPrice: filters.minPrice ? Math.round(filters.minPrice * 1e9) : undefined, // Convert SOL to lamports
        maxPrice: filters.maxPrice ? Math.round(filters.maxPrice * 1e9) : undefined, // Convert SOL to lamports
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

  // Debounce filter changes (search, category, sort, price)
  useEffect(() => {
    if (page === 1) {
      debouncedLoadContents();
    } else {
      loadContents();
    }
  }, [filters.search, filters.category, filters.sort, filters.currency, filters.minPrice, filters.maxPrice]);

  const clearFilters = () => {
    setFilters({
      category: '',
      search: '',
      sort: 'newest',
      currency: '',
      minPrice: undefined,
      maxPrice: undefined,
    });
    setPage(1);
  };

  const hasActiveFilters = filters.category || filters.search || filters.currency || filters.minPrice || filters.maxPrice || filters.sort !== 'newest';

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
      {/* Filters Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-700"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs text-emerald-950">
                Active
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-300 transition"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear all
            </button>
          )}
        </div>
        <div className="text-sm text-neutral-400">
          {total > 0 && (
            <>
              Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, total)} of {total} results
            </>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-8 rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
                disabled={categoriesLoading}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value as any })}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
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
                <option value="">All Currencies</option>
                <option value="SOL">SOL</option>
                <option value="USDC">USDC</option>
                <option value="PYUSD">PYUSD</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">Min Price (SOL)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0.000"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">Max Price (SOL)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={filters.maxPrice || ''}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="No limit"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {contents.length === 0 && !loading ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-16 text-center">
          <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-neutral-600 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No content found</h3>
          <p className="text-neutral-400 mb-6 max-w-md mx-auto">
            {hasActiveFilters
              ? "We couldn't find any content matching your filters. Try adjusting your search criteria or clearing filters."
              : "There's no content available at the moment. Check back later!"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Clear All Filters
            </button>
          )}
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
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-neutral-400">
                Page {page} of {Math.ceil(total / 20)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(total / 20)) }, (_, i) => {
                    const totalPages = Math.ceil(total / 20);
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          page === pageNum
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 20)}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(Math.ceil(total / 20))}
                  disabled={page >= Math.ceil(total / 20)}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


