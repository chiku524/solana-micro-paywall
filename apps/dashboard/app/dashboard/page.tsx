'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../components/dashboard/navbar';
import { apiClient } from '../../lib/api-client';
import { DashboardProviders } from '../../components/dashboard-providers';

interface DashboardStats {
  merchant: {
    id: string;
    email: string;
    status: string;
    payoutAddress: string | null;
  };
  stats: {
    totalPayments: number;
    todayPayments: number;
    weekPayments: number;
    monthPayments: number;
    totalRevenue: string;
    avgPaymentAmount: string;
  };
  recentPayments: Array<{
    id: string;
    txSignature: string;
    amount: string;
    currency: string;
    payerWallet: string;
    confirmedAt: string;
    content: string;
  }>;
}

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.log('DashboardPageContent - Redirecting with stored merchantId:', storedMerchantId);
        router.replace(`/dashboard?merchantId=${storedMerchantId}`);
        return;
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Get merchantId from URL or localStorage
    const urlMerchantId = searchParams.get('merchantId') || '';
    const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
    const currentMerchantId = urlMerchantId || storedMerchantId;
    
    // Debug logging
    console.log('DashboardPageContent - URL merchantId:', urlMerchantId);
    console.log('DashboardPageContent - Stored merchantId:', storedMerchantId);
    console.log('DashboardPageContent - Current merchantId:', currentMerchantId);
    console.log('DashboardPageContent - searchParams:', searchParams.toString());
    console.log('DashboardPageContent - window.location:', typeof window !== 'undefined' ? window.location.href : 'SSR');
    
    if (!currentMerchantId) {
      setError('Merchant ID is required. Please go to the home page and create a merchant account or enter your merchant ID.');
      setLoading(false);
      return;
    }

    // If we have URL merchantId, use it. Otherwise wait for redirect
    if (urlMerchantId) {
      async function loadDashboard() {
        try {
          const data = await apiClient.getMerchantDashboard(urlMerchantId);
          setStats(data);
          setError(null);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
          setError(errorMessage);
          console.error('Dashboard load error:', err);
        } finally {
          setLoading(false);
        }
      }

      loadDashboard();
    } else if (storedMerchantId) {
      // We have it in localStorage but not in URL - redirect is happening, wait for it
      setLoading(true);
      // Don't load yet, wait for redirect to complete
    }
  }, [searchParams]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
            <p className="text-neutral-400">Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !stats) {
    const urlMerchantId = searchParams.get('merchantId') || '';
    const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
    const hasMerchantId = urlMerchantId || storedMerchantId;
    
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-400">
              {error || 'Failed to load dashboard'}
            </div>
            {!hasMerchantId && (
              <div className="mt-4 space-y-4">
                <p className="text-neutral-300">
                  You need a merchant ID to access the dashboard.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-emerald-950 transition hover:bg-emerald-400"
                >
                  Go to Home Page
                </Link>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  const formatAmount = (lamports: string, currency: string = 'SOL') => {
    const amount = Number(lamports) / 1e9;
    return `${amount.toFixed(4)} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-neutral-400">
              Welcome back, {stats.merchant.email}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
              <p className="text-sm font-medium text-neutral-400">Total Payments</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.stats.totalPayments}</p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
              <p className="text-sm font-medium text-neutral-400">Today</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">{stats.stats.todayPayments}</p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
              <p className="text-sm font-medium text-neutral-400">This Week</p>
              <p className="mt-2 text-3xl font-bold text-blue-400">{stats.stats.weekPayments}</p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
              <p className="text-sm font-medium text-neutral-400">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">
                {formatAmount(stats.stats.totalRevenue, 'SOL')}
              </p>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60">
            <div className="border-b border-neutral-800 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Recent Payments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-800">
                <thead className="bg-neutral-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Payer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 bg-neutral-900/60">
                  {stats.recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-neutral-400">
                        No payments yet
                      </td>
                    </tr>
                  ) : (
                    stats.recentPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-neutral-800/30">
                        <td className="whitespace-nowrap px-6 py-4">
                          <a
                            href={`https://solscan.io/tx/${payment.txSignature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-emerald-400 hover:text-emerald-300"
                          >
                            {payment.txSignature.slice(0, 8)}...{payment.txSignature.slice(-8)}
                          </a>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-300">
                          {payment.content}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                          {formatAmount(payment.amount, payment.currency)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-mono text-xs text-neutral-400">
                            {payment.payerWallet.slice(0, 6)}...{payment.payerWallet.slice(-4)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-400">
                          {formatDate(payment.confirmedAt)}
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

export default function DashboardPage() {
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
        <DashboardPageContent />
      </Suspense>
    </DashboardProviders>
  );
}

