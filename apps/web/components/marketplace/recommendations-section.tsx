'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { apiClient, Content } from '../../lib/api-client';
import { ContentCard } from './content-card';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface RecommendationsSectionProps {
  contentId?: string;
  title?: string;
  limit?: number;
}

export function RecommendationsSection({
  contentId,
  title = 'You might also like',
  limit = 6,
}: RecommendationsSectionProps) {
  const { publicKey, connected } = useWallet();
  const [recommendations, setRecommendations] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [publicKey, connected, contentId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      let results: Content[] = [];

      if (contentId) {
        // Get recommendations based on specific content
        results = (await apiClient.getRecommendationsForContent(contentId, limit)) as Content[];
      } else if (connected && publicKey) {
        // Get recommendations based on wallet purchase history
        results = (await apiClient.getRecommendationsForWallet(publicKey.toString(), limit)) as Content[];
      }

      setRecommendations(results || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mt-12">
        <div className="mb-6 flex items-center space-x-2">
          <SparklesIcon className="h-6 w-6 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-neutral-900/50" />
          ))}
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center space-x-2">
        <SparklesIcon className="h-6 w-6 text-emerald-400" />
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recommendations.map((content) => (
          <ContentCard key={content.id} content={content} />
        ))}
      </div>
    </section>
  );
}

