'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Navbar } from '@/components/navbar';
import { ContentCard } from '@/components/content-card';
import { apiGet } from '@/lib/api';
import type { Content } from '@/types';

export default function MarketplacePage() {
  const { data: trending, isLoading: trendingLoading } = useSWR<{ content: Content[] }>(
    '/api/discover/trending',
    apiGet
  );
  
  const { data: recent, isLoading: recentLoading } = useSWR<{ content: Content[] }>(
    '/api/discover/recent',
    apiGet
  );
  
  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Marketplace</h1>
        
        {/* Trending Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Trending</h2>
          {trendingLoading ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-neutral-900 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trending?.content.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          )}
        </section>
        
        {/* Recent Section */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Recently Added</h2>
          {recentLoading ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-neutral-900 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recent?.content.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
