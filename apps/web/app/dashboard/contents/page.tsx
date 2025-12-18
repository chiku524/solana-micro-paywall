'use client';

// Ensure Next generates an edge-compatible, statically addressable route for Cloudflare.
export const runtime = 'edge';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { apiClient } from '../../../lib/api-client';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { showSuccess, showError, showLoading, updateToast } from '../../../lib/toast';
import { logger } from '../../../lib/logger';
import { contentSchema, type ContentFormData } from '../../../lib/validations/content';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';

interface Content {
  id: string;
  slug: string;
  priceLamports: string;
  currency: string;
  durationSecs: number | null;
  createdAt: string;
  merchant: {
    id: string;
    email: string;
  };
  _count: {
    paymentIntents: number;
  };
}

function ContentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Form for creating content
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      currency: 'SOL',
    },
  });

  // Handle redirect if merchantId is in localStorage but not in URL
  useEffect(() => {
    const urlMerchantId = searchParams.get('merchantId') || '';
    
    if (urlMerchantId && typeof window !== 'undefined') {
      localStorage.setItem('merchantId', urlMerchantId);
      return;
    }
    
    if (typeof window !== 'undefined' && !urlMerchantId) {
      const storedMerchantId = localStorage.getItem('merchantId') || '';
      if (storedMerchantId) {
        router.replace(`/dashboard/contents?merchantId=${storedMerchantId}`);
        return;
      }
    }
  }, [searchParams, router]);

  const getMerchantId = useCallback(() => {
    const urlMerchantId = searchParams.get('merchantId') || '';
    if (urlMerchantId) {
      return urlMerchantId;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem('merchantId') || '';
    }
    return '';
  }, [searchParams]);

  const loadContents = useCallback(async (merchantIdToUse: string) => {
    if (!merchantIdToUse) {
      setError('Merchant ID is required');
      setLoading(false);
      return;
    }
    
    try {
      const response = await apiClient.getContents({ merchantId: merchantIdToUse }) as any;
      setContents(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlMerchantId = searchParams.get('merchantId') || '';
    const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
    const currentMerchantId = urlMerchantId || storedMerchantId;
    
    if (!currentMerchantId) {
      setError('Merchant ID is required. Please go to the home page and create a merchant account or enter your merchant ID.');
      setLoading(false);
      return;
    }

    if (urlMerchantId) {
      setError(null);
      setLoading(true);
      loadContents(urlMerchantId);
    } else if (storedMerchantId) {
      setLoading(true);
    }
  }, [searchParams, loadContents]);

  const onSubmit = async (data: ContentFormData) => {
    const merchantId = getMerchantId();
    
    if (!merchantId) {
      showError('Merchant ID is missing. Please refresh the page.');
      return;
    }

    setCreateLoading(true);
    const loadingToast = showLoading('Creating content...');
    
    try {
      const priceValue = parseFloat(data.priceLamports);
      const priceLamports = Math.floor(priceValue * 1e9);
      
      await apiClient.createContent({
        merchantId,
        slug: data.slug.trim(),
        priceLamports,
        currency: data.currency,
        durationSecs: data.durationSecs && data.durationSecs.trim() 
          ? parseInt(data.durationSecs) 
          : undefined,
      });
      // Optimistic UI update - add content to list immediately
      const newContent = {
        id: 'temp-' + Date.now(), // Temporary ID
        slug: data.slug.trim(),
        priceLamports: (priceLamports / 1e9).toFixed(4),
        currency: data.currency,
        durationSecs: data.durationSecs ? parseInt(data.durationSecs.toString()) : null,
        createdAt: new Date().toISOString(),
        merchant: { id: merchantId, email: '' },
        _count: { paymentIntents: 0 },
      };
      setContents((prev) => [newContent as any, ...prev]);
      
      updateToast(loadingToast, 'Content created successfully!', 'success');
      setShowCreateModal(false);
      reset();
      
      // Reload to get real data (will replace optimistic update)
      await loadContents(merchantId);
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      logger.error('Content creation error', err instanceof Error ? err : new Error(String(err)), {
        merchantId,
        slug: data.slug,
      });
      updateToast(loadingToast, `Failed to create content: ${errorMessage}`, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  async function handleDelete(id: string) {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this content?');
    if (!confirmed) return;

    // Optimistic UI update - remove from list immediately
    const deletedContent = contents.find((c) => c.id === id);
    setContents((prev) => prev.filter((c) => c.id !== id));

    try {
      const merchantId = getMerchantId();
      const loadingToast = showLoading('Deleting content...');
      await apiClient.deleteContent(id);
      updateToast(loadingToast, 'Content deleted successfully!', 'success');
    } catch (err) {
      // Rollback optimistic update on error
      if (deletedContent) {
        setContents((prev) => [...prev, deletedContent]);
      }
      showError(`Failed to delete content: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  const formatAmount = (lamports: string, currency: string = 'SOL') => {
    const amount = Number(lamports) / 1e9;
    return `${amount.toFixed(4)} ${currency}`;
  };

  if (loading) {
    const merchantId = getMerchantId();
    
    if (!merchantId) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-400">
              Merchant ID is required. Please go to the home page and create a merchant account or enter your merchant ID.
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
          <p className="text-neutral-400">Loading contents...</p>
        </div>
      </div>
    );
  }
  
  const merchantId = getMerchantId();
  if (!merchantId && error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-400">
            {error}
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-emerald-950 transition hover:bg-emerald-400"
          >
            Go to Home Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 lg:py-8 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Contents</h1>
            <p className="mt-2 text-sm sm:text-base text-neutral-400">Manage your paywall content</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm sm:text-base font-medium text-emerald-950 transition hover:bg-emerald-400"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Content</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-400">
            {error}
          </div>
        )}

          {/* Create Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              reset();
            }}
            title="Create Content"
            size="md"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                {...register('slug')}
                label="Slug"
                type="text"
                placeholder="premium-article"
                error={errors.slug?.message}
                helperText="Use lowercase letters, numbers, and hyphens only"
                fullWidth
              />
              <Input
                {...register('priceLamports')}
                label="Price (SOL)"
                type="number"
                step="0.0001"
                placeholder="0.1"
                error={errors.priceLamports?.message}
                fullWidth
              />
              <div className="flex flex-col">
                <label className="mb-1 block text-sm font-medium text-neutral-300">Currency</label>
                <select
                  {...register('currency')}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
                >
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                  <option value="PYUSD">PYUSD</option>
                </select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-400">{errors.currency.message}</p>
                )}
              </div>
              <Input
                {...register('durationSecs')}
                label="Duration (seconds, optional)"
                type="number"
                placeholder="86400 (24 hours)"
                error={errors.durationSecs?.message}
                helperText="Leave empty for one-time purchase"
                fullWidth
              />
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={createLoading}
                  disabled={createLoading}
                >
                  Create
                </Button>
              </div>
            </form>
          </Modal>

        {/* Contents List */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-neutral-800">
              <thead className="bg-neutral-800/50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Slug
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Price
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400 hidden sm:table-cell">
                    Duration
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400 hidden md:table-cell">
                    Payments
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-900/60">
                {contents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-neutral-400">
                      No contents yet. Create your first content!
                    </td>
                  </tr>
                ) : (
                  contents.map((content) => (
                    <tr key={content.id} className="hover:bg-neutral-800/30">
                      <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-white">
                        {content.slug}
                      </td>
                      <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-xs sm:text-sm text-neutral-300">
                        {formatAmount(content.priceLamports, content.currency)}
                        <div className="mt-1 sm:hidden text-xs text-neutral-500">
                          {content.durationSecs
                            ? `${Math.floor(content.durationSecs / 3600)} hours`
                            : 'One-time'} • {content._count.paymentIntents} payments
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-xs sm:text-sm text-neutral-300 hidden sm:table-cell">
                        {content.durationSecs
                          ? `${Math.floor(content.durationSecs / 3600)} hours`
                          : 'One-time'}
                      </td>
                      <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-xs sm:text-sm text-neutral-300 hidden md:table-cell">
                        {content._count.paymentIntents}
                      </td>
                        <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-xs sm:text-sm">
                          <Button
                            onClick={() => handleDelete(content.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            title="Delete content"
                          >
                            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
            <p className="text-neutral-400">Loading...</p>
          </div>
        </div>
      }
    >
      <ContentsPageContent />
    </Suspense>
  );
}


