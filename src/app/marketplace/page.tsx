'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ContentCard } from '@/components/content-card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { EmptySearch } from '@/components/ui/empty-state';
import { useDebounce } from '@/lib/use-debounce';
import { apiGet } from '@/lib/api';
import { formatSol } from '@/lib/utils';
import type { Content } from '@/types';

type SortOption = 'recent' | 'trending' | 'price-low' | 'price-high' | 'purchases';
type PriceRange = { min: number; max: number };

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 1000 });
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: trending, isLoading: trendingLoading } = useSWR<{ content: Content[] }>(
    '/api/discover/trending',
    (url: string) => apiGet<{ content: Content[] }>(url)
  );
  
  const { data: recent, isLoading: recentLoading } = useSWR<{ content: Content[] }>(
    '/api/discover/recent',
    (url: string) => apiGet<{ content: Content[] }>(url)
  );
  
  // Combine all content for filtering
  const allContent = useMemo(() => {
    const combined = [
      ...(trending?.content || []),
      ...(recent?.content || []),
    ];
    // Remove duplicates by ID
    const unique = combined.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    return unique;
  }, [trending, recent]);
  
  // Extract unique categories and tags
  const categories = useMemo(() => 
    Array.from(new Set(allContent.map(c => c.category).filter((cat): cat is string => Boolean(cat)))),
    [allContent]
  );
  
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allContent.forEach(item => {
      if (item.tags) {
        const tagArray = Array.isArray(item.tags) ? item.tags : item.tags.split(',').map(t => t.trim());
        tagArray.forEach(tag => tag && tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [allContent]);
  
  // Comprehensive filtering
  const filteredAndSortedContent = useMemo(() => {
    let filtered = allContent.filter(item => {
      // Search filter (use debounced value)
      const matchesSearch = !debouncedSearchQuery || 
        item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        item.merchantId?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      
      // Tags filter
      const matchesTags = selectedTags.length === 0 || 
        (item.tags && (Array.isArray(item.tags) 
          ? item.tags.some(tag => selectedTags.includes(tag))
          : item.tags.split(',').some(tag => selectedTags.includes(tag.trim()))
        ));
      
      // Price range filter
      const priceInSol = item.priceLamports / 1_000_000_000;
      const matchesPrice = priceInSol >= priceRange.min && priceInSol <= priceRange.max;
      
      return matchesSearch && matchesCategory && matchesTags && matchesPrice;
    });
    
    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.priceLamports - b.priceLamports;
        case 'price-high':
          return b.priceLamports - a.priceLamports;
        case 'purchases':
          return (b.purchaseCount || 0) - (a.purchaseCount || 0);
        case 'trending':
          return (b.purchaseCount || 0) - (a.purchaseCount || 0);
        case 'recent':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
    
    return filtered;
  }, [allContent, debouncedSearchQuery, selectedCategory, selectedTags, priceRange, sortBy]);
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 dark:text-white mb-4">
            <span className="gradient-text">Discover Content</span>
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
            Browse premium content from creators across the blockchain. Purchase once, access forever.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <SearchInput
              value={searchQuery}
              onSearch={setSearchQuery}
              placeholder="Search for content, creators, or topics..."
              debounceMs={500}
            />
          </div>
          
          {/* Filter Toggle */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
          
          {/* Comprehensive Filters */}
          {showFilters && (
            <div className="max-w-5xl mx-auto mb-8 glass-strong p-6 rounded-xl">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Sort By</label>
                  <div className="flex flex-wrap gap-2">
                    {(['recent', 'trending', 'price-low', 'price-high', 'purchases'] as SortOption[]).map((option) => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          sortBy === option
                            ? 'bg-gradient-primary text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {option === 'price-low' ? 'Price: Low to High' :
                         option === 'price-high' ? 'Price: High to Low' :
                         option === 'purchases' ? 'Most Purchased' :
                         option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Price Range: {formatSol(priceRange.min * 1_000_000_000)} - {formatSol(priceRange.max * 1_000_000_000)} SOL
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseFloat(e.target.value) || 0 }))}
                      className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 outline-none"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseFloat(e.target.value) || 1000 }))}
                      className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 outline-none"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
              
              {/* Category Filters */}
              {categories.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !selectedCategory
                          ? 'bg-gradient-primary text-white'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category
                            ? 'bg-gradient-primary text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.slice(0, 20).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {tag} {selectedTags.includes(tag) && '✓'}
                      </button>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                    >
                      Clear all tags
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
        
        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-neutral-400">
            {filteredAndSortedContent.length} {filteredAndSortedContent.length === 1 ? 'item' : 'items'} found
          </p>
          {(selectedCategory || selectedTags.length > 0 || debouncedSearchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedTags([]);
                setPriceRange({ min: 0, max: 1000 });
              }}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              Clear all filters
            </button>
          )}
        </div>
        
        {/* Content Grid */}
        {filteredAndSortedContent.length > 0 ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAndSortedContent.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <div className="glass-strong p-12 rounded-xl text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Content Found</h2>
            <p className="text-neutral-400 mb-6">Try adjusting your filters or search query.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedTags([]);
                setPriceRange({ min: 0, max: 1000 });
              }}
              className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
