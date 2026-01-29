'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import type { Content } from '@/types';

function DiscoverContent() {
  const searchParams = useSearchParams();
  const sort = searchParams.get('sort') || 'recent';
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data, isLoading } = useSWR<{ content: Content[] }>(
    `/api/discover/${sort === 'trending' ? 'trending' : 'recent'}`,
    (url: string) => apiGet<{ content: Content[] }>(url)
  );
  
  // Extract unique categories
  const categories = Array.from(
    new Set(
      data?.content.map(c => c.category).filter((cat): cat is string => Boolean(cat)) || []
    )
  );
  
  // Filter content (use debounced search)
  const filteredContent = (data?.content || []).filter(item => {
    const matchesSearch = !debouncedSearchQuery || 
      item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            {sort === 'trending' ? 'Trending Content' : 'All Content'}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {sort === 'trending' 
              ? 'Discover the most popular content on the platform'
              : 'Browse all available content'}
          </p>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <SearchInput
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search for content, creators, or topics..."
            debounceMs={500}
          />
          
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-gradient-primary text-white'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
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
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Content Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-neutral-900 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredContent.length > 0 ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredContent.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <EmptySearch query={debouncedSearchQuery || undefined} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neutral-900 dark:text-white">Loading...</div>
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  );
}

