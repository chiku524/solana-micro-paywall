'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { formatSol } from '@/lib/utils';
import type { Content } from '@/types';

export default function ContentsPage() {
  const { token } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { data, mutate } = useSWR<{ contents: Content[] }>(
    token ? ['/api/contents', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );
  
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
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
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to create content');
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">Content Management</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>Create Content</Button>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.contents.map((content) => (
            <div key={content.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">{content.title}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">{content.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatSol(content.priceLamports)} SOL
                </span>
                <span className="text-sm text-neutral-500">
                  {content.purchaseCount} purchases
                </span>
              </div>
            </div>
          ))}
        </div>
        
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
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </Modal>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
