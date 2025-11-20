'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../../components/dashboard/navbar';
import { apiClient } from '../../../lib/api-client';
import { DashboardProviders } from '../../../components/dashboard-providers';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

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
  const [newContent, setNewContent] = useState({
    slug: '',
    priceLamports: '',
    currency: 'SOL',
    durationSecs: '',
  });

  // Handle redirect if merchantId is in localStorage but not in URL
  useEffect(() => {
    const urlMerchantId = searchParams.get('merchantId') || '';
    
    // If we have merchantId in URL, store it and we're good
    if (urlMerchantId && typeof window !== 'undefined') {
      localStorage.setItem('merchantId', urlMerchantId);
      return;
    }
    
    // If no merchantId in URL, check localStorage
    if (typeof window !== 'undefined' && !urlMerchantId) {
      const storedMerchantId = localStorage.getItem('merchantId') || '';
      if (storedMerchantId) {
        console.log('ContentsPageContent - Redirecting with stored merchantId:', storedMerchantId);
        router.replace(`/dashboard/contents?merchantId=${storedMerchantId}`);
        return;
      }
    }
  }, [searchParams, router]);

  // Get merchantId from URL (after redirect completes)
  const getMerchantId = useCallback(() => {
    const urlMerchantId = searchParams.get('merchantId') || '';
    if (urlMerchantId) {
      return urlMerchantId;
    }
    // Fallback to localStorage for immediate use (before redirect completes)
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
      const response = await apiClient.getContents({ merchantId: merchantIdToUse }) as { data: Content[] };
      setContents(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get merchantId from URL or localStorage
    const urlMerchantId = searchParams.get('merchantId') || '';
    const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
    const currentMerchantId = urlMerchantId || storedMerchantId;
    
    // Debug logging
    console.log('ContentsPageContent - URL merchantId:', urlMerchantId);
    console.log('ContentsPageContent - Stored merchantId:', storedMerchantId);
    console.log('ContentsPageContent - Current merchantId:', currentMerchantId);
    console.log('ContentsPageContent - searchParams:', searchParams.toString());
    console.log('ContentsPageContent - window.location:', typeof window !== 'undefined' ? window.location.href : 'SSR');
    
    if (!currentMerchantId) {
      setError('Merchant ID is required. Please go to the home page and create a merchant account or enter your merchant ID.');
      setLoading(false);
      return;
    }

    // If we have URL merchantId, use it. Otherwise wait for redirect
    if (urlMerchantId) {
      setError(null);
      setLoading(true);
      loadContents(urlMerchantId);
    } else if (storedMerchantId) {
      // We have it in localStorage but not in URL - redirect is happening, wait for it
      setLoading(true);
      // Don't load yet, wait for redirect to complete
    }
  }, [searchParams, loadContents]);

  async function handleCreate() {
    if (!newContent.slug || !newContent.priceLamports) {
      alert('Please fill in slug and price');
      return;
    }

    const urlMerchantId = searchParams.get('merchantId') || '';
    const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
    const currentMerchantId = urlMerchantId || storedMerchantId;
    
    if (!currentMerchantId) {
      alert('Merchant ID is missing. Please refresh the page.');
      return;
    }

    try {
      const priceValue = parseFloat(newContent.priceLamports);
      if (isNaN(priceValue) || priceValue <= 0) {
        alert('Please enter a valid price greater than 0');
        return;
      }

      const priceLamports = Math.floor(priceValue * 1e9);
      
      await apiClient.createContent({
        merchantId: currentMerchantId,
        slug: newContent.slug.trim(),
        priceLamports,
        currency: newContent.currency as 'SOL' | 'USDC' | 'PYUSD',
        durationSecs: newContent.durationSecs && newContent.durationSecs.trim() 
          ? parseInt(newContent.durationSecs) 
          : undefined,
      });
      setShowCreateModal(false);
      setNewContent({ slug: '', priceLamports: '', currency: 'SOL', durationSecs: '' });
      setLoading(true);
      await loadContents(currentMerchantId);
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      console.error('Content creation error:', err);
      alert(`Failed to create content: ${errorMessage}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const urlMerchantId = searchParams.get('merchantId') || '';
      const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
      const currentMerchantId = urlMerchantId || storedMerchantId;

      await apiClient.deleteContent(id);
      setLoading(true);
      await loadContents(currentMerchantId);
    } catch (err) {
      alert(`Failed to delete content: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  const formatAmount = (lamports: string, currency: string = 'SOL') => {
    const amount = Number(lamports) / 1e9;
    return `${amount.toFixed(4)} ${currency}`;
  };

  if (loading) {
    const urlMerchantId = searchParams.get('merchantId') || '';
    const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
    const hasMerchantId = urlMerchantId || storedMerchantId;
    
    // If we're loading but have no merchantId, show error instead
    if (!hasMerchantId) {
      return (
        <>
          <Navbar />
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
        </>
      );
    }
    
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
            <p className="text-neutral-400">Loading contents...</p>
          </div>
        </div>
      </>
    );
  }
  
  // Show error state if no merchantId
  const urlMerchantId = searchParams.get('merchantId') || '';
  const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
  if (!urlMerchantId && !storedMerchantId && error) {
    return (
      <>
        <Navbar />
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
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Contents</h1>
              <p className="mt-2 text-neutral-400">Manage your paywall content</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-emerald-950 transition hover:bg-emerald-400"
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
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 p-6">
                <h2 className="mb-4 text-xl font-bold text-white">Create Content</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300">Slug</label>
                    <input
                      type="text"
                      value={newContent.slug}
                      onChange={(e) => setNewContent({ ...newContent, slug: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
                      placeholder="premium-article"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300">Price (SOL)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newContent.priceLamports}
                      onChange={(e) => setNewContent({ ...newContent, priceLamports: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
                      placeholder="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300">Currency</label>
                    <select
                      value={newContent.currency}
                      onChange={(e) => setNewContent({ ...newContent, currency: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
                    >
                      <option value="SOL">SOL</option>
                      <option value="USDC">USDC</option>
                      <option value="PYUSD">PYUSD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300">Duration (seconds, optional)</label>
                    <input
                      type="number"
                      value={newContent.durationSecs}
                      onChange={(e) => setNewContent({ ...newContent, durationSecs: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
                      placeholder="86400 (24 hours)"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-lg border border-neutral-700 px-4 py-2 text-neutral-300 hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-emerald-950 hover:bg-emerald-400"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contents List */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-800">
                <thead className="bg-neutral-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Payments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 bg-neutral-900/60">
                  {contents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-neutral-400">
                        No contents yet. Create your first content!
                      </td>
                    </tr>
                  ) : (
                    contents.map((content) => (
                      <tr key={content.id} className="hover:bg-neutral-800/30">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                          {content.slug}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-300">
                          {formatAmount(content.priceLamports, content.currency)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-300">
                          {content.durationSecs
                            ? `${Math.floor(content.durationSecs / 3600)} hours`
                            : 'One-time'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-300">
                          {content._count.paymentIntents}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDelete(content.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
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
    </>
  );
}

export default function ContentsPage() {
  return (
    <DashboardProviders>
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
    </DashboardProviders>
  );
}

