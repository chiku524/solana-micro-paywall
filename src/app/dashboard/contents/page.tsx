'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { formatSol } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import type { Content } from '@/types';

export default function ContentsPage() {
  const { token } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ contents: Content[] }>(
    token ? ['/api/contents', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);
    try {
      await apiPost(
        '/api/contents',
        {
          slug: formData.get('slug'),
          title: formData.get('title'),
          description: formData.get('description'),
          priceLamports: Math.floor(parseFloat(formData.get('price') as string) * 1_000_000_000),
          visibility: formData.get('visibility') || 'public',
        },
        token || undefined
      );
      mutate();
      setIsCreateModalOpen(false);
      showToast.success('Content created successfully');
    } catch (err: unknown) {
      showToast.error(err instanceof Error ? err.message : 'Failed to create content');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contents = data?.contents ?? [];
  const isEmpty = !isLoading && !error && contents.length === 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-transparent">
        <Navbar />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full relative z-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">Content Management</h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">Create and manage your paywalled content</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="sm:shrink-0">
              Create Content
            </Button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-300">
              Failed to load content. Please try again.
            </div>
          )}

          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-strong border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6 mb-4" />
                  <div className="flex justify-between mt-4">
                    <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-24" />
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && isEmpty && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50 py-16">
              <EmptyState
                icon={
                  <svg className="w-16 h-16 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
                title="No content yet"
                description="Create your first piece of content to start earning. Set a price and share the link with your audience."
                action={{ label: 'Create Content', onClick: () => setIsCreateModalOpen(true) }}
              />
            </div>
          )}

          {!isLoading && !error && contents.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((content) => (
                <div
                  key={content.id}
                  className="glass-strong border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 p-6 rounded-xl transition-colors"
                >
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">{content.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4 line-clamp-2">{content.description || 'No description'}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatSol(content.priceLamports)} SOL
                    </span>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {content.purchaseCount} purchase{content.purchaseCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
        <Footer />

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Content"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                Slug
              </label>
              <input
                type="text"
                name="slug"
                required
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                Price (SOL)
              </label>
              <input
                type="number"
                name="price"
                step="0.0001"
                required
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create'}
            </Button>
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
