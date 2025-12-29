'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ContentCard } from '@/components/content-card';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import type { Content } from '@/types';

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: trending, isLoading: trendingLoading } = useSWR<{ content: Content[] }>(
    '/api/discover/trending',
    (url: string) => apiGet<{ content: Content[] }>(url)
  );
  
  const { data: recent, isLoading: recentLoading } = useSWR<{ content: Content[] }>(
    '/api/discover/recent',
    (url: string) => apiGet<{ content: Content[] }>(url)
  );
  
  // Extract unique categories from content
  const categories = Array.from(
    new Set([
      ...(trending?.content.map(c => c.category).filter(Boolean) || []),
      ...(recent?.content.map(c => c.category).filter(Boolean) || [])
    ])
  );
  
  // Filter content based on search and category
  const filterContent = (content: Content[]) => {
    return content.filter(item => {
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };
  
  const filteredTrending = trending?.content ? filterContent(trending.content) : [];
  const filteredRecent = recent?.content ? filterContent(recent.content) : [];
  
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            <span className="gradient-text">Discover Content</span>
          </h1>
          <p className="text-xl text-neutral-400 mb-8 max-w-2xl mx-auto">
            Browse premium content from creators across the blockchain. Purchase once, access forever.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for content, creators, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-12 bg-neutral-900 text-white rounded-xl border border-neutral-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
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
          )}
        </section>
        
        {/* Trending Section */}
        {(filteredTrending.length > 0 || trendingLoading) && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-primary rounded-full"></div>
                <h2 className="text-3xl font-bold text-white">Trending Now</h2>
              </div>
              <Link href="/marketplace/discover?sort=trending">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            {trendingLoading ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-neutral-900 rounded-lg h-64 animate-pulse" />
                ))}
              </div>
            ) : filteredTrending.length > 0 ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredTrending.slice(0, 8).map((content) => (
                  <ContentCard key={content.id} content={content} />
                ))}
              </div>
            ) : (
              <div className="glass-strong p-12 rounded-xl text-center">
                <p className="text-neutral-400">No trending content found matching your filters.</p>
              </div>
            )}
          </section>
        )}
        
        {/* Recent Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-secondary rounded-full"></div>
              <h2 className="text-3xl font-bold text-white">Recently Added</h2>
            </div>
            <Link href="/marketplace/discover?sort=recent">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          {recentLoading ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-neutral-900 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          ) : filteredRecent.length > 0 ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredRecent.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          ) : (
            <div className="glass-strong p-12 rounded-xl text-center">
              <p className="text-neutral-400">No recent content found matching your filters.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
