'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatSol } from '@/lib/utils';
import type { Content } from '@/types';

export default function ContentsPage() {
  const router = useRouter();
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  useEffect(() => {
    const storedMerchantId = localStorage.getItem('merchantId');
    const storedToken = localStorage.getItem('token');
    
    if (storedMerchantId) setMerchantId(storedMerchantId);
    if (storedToken) setToken(storedToken);
    
    if (!storedToken || !storedMerchantId) {
      router.push('/dashboard');
    }
  }, [router]);
  
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
    } catch (error: any) {
      alert(error.message || 'Failed to create content');
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Content Management</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>Create Content</Button>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.contents.map((content) => (
            <div key={content.id} className="bg-neutral-900 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">{content.title}</h3>
              <p className="text-neutral-400 mb-4">{content.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-bold">
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
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Slug
              </label>
              <input
                type="text"
                name="slug"
                required
                className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Price (SOL)
              </label>
              <input
                type="number"
                name="price"
                step="0.0001"
                required
                className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg"
              />
            </div>
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
