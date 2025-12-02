'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { apiClient } from '../../lib/api-client';
import { MerchantLogin } from '../../components/merchant-login';
import { SkeletonTable } from '../../components/ui/skeleton';
import { ErrorBoundary } from '../../components/ui/error-boundary';

// CRITICAL: This is a client component, so it should always render
// If the server returns 503, Next.js might serve fallback content
// This component must handle all errors gracefully

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
        router.replace(`/dashboard?merchantId=${storedMerchantId}`);
        return;
      }
    }
  }, [searchParams, router]);

  // Get merchantId from URL or localStorage
  const urlMerchantId = searchParams.get('merchantId') || '';
  const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
  const currentMerchantId = urlMerchantId || storedMerchantId;

  // Use SWR for data fetching with automatic caching and revalidation
  const { data: stats, error, isLoading } = useSWR<DashboardStats>(
    currentMerchantId ? `dashboard-${currentMerchantId}` : null,
    async (): Promise<DashboardStats> => {
      if (!currentMerchantId) throw new Error('Merchant ID required');
      return apiClient.getMerchantDashboard(currentMerchantId) as Promise<DashboardStats>;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  );

  const loading = isLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="mb-4 h-8 w-48 animate-pulse rounded bg-neutral-800" />
            <div className="h-4 w-64 animate-pulse rounded bg-neutral-800" />
          </div>
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
                <div className="mb-2 h-4 w-24 rounded bg-neutral-800" />
                <div className="h-8 w-32 rounded bg-neutral-800" />
              </div>
            ))}
          </div>
          <SkeletonTable />
        </div>
      </div>
    );
  }

  // If no merchantId, show login form
  if (!currentMerchantId) {
    return (
      <div className="min-h-screen bg-transparent relative z-10" data-page="dashboard" data-route="/dashboard">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Merchant Dashboard</h1>
            <p className="text-neutral-400">Create an account or log in to access your dashboard</p>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <MerchantLogin />
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-emerald-400 hover:text-emerald-300"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Failed to load dashboard');
    const urlMerchantId = searchParams.get('merchantId') || '';
    const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
    const hasMerchantId = urlMerchantId || storedMerchantId;
    
    // If no merchantId, show login form
    if (!hasMerchantId) {
      return (
        <div className="min-h-screen bg-transparent" data-page="dashboard" data-route="/dashboard">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-2">Merchant Dashboard</h1>
              <p className="text-neutral-400">Create an account or log in to access your dashboard</p>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <MerchantLogin />
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="text-emerald-400 hover:text-emerald-300"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    
    // Show error state
    return (
      <div className="flex min-h-screen items-center justify-center relative z-10">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-400">
            {errorMessage}
          </div>
          <div className="mt-4 space-y-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
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
    <div className="min-h-screen bg-transparent relative z-10" data-page="dashboard" data-route="/dashboard">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 lg:py-8 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-400">
            Welcome back, {stats.merchant.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 sm:mb-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-neutral-400">Total Payments</p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">{stats.stats.totalPayments}</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-neutral-400">Today</p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-400">{stats.stats.todayPayments}</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-neutral-400">This Week</p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-blue-400">{stats.stats.weekPayments}</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-neutral-400">Total Revenue</p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-400">
              {formatAmount(stats.stats.totalRevenue, 'SOL')}
            </p>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60">
          <div className="border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-white">Recent Payments</h2>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-neutral-800">
              <thead className="bg-neutral-800/50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Transaction
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400 hidden sm:table-cell">
                    Content
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Amount
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400 hidden md:table-cell">
                    Payer
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400 hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-900/60">
                {stats.recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-neutral-400">
                      No payments yet
                    </td>
                  </tr>
                ) : (
                  stats.recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-neutral-800/30">
                      <td className="whitespace-nowrap px-3 sm:px-6 py-4">
                        <a
                          href={`https://solscan.io/tx/${payment.txSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs sm:text-sm text-emerald-400 hover:text-emerald-300"
                        >
                          {payment.txSignature.slice(0, 8)}...{payment.txSignature.slice(-8)}
                        </a>
                        <div className="mt-1 sm:hidden text-xs text-neutral-400">{payment.content}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-neutral-300 hidden sm:table-cell">
                        {payment.content}
                      </td>
                      <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-white">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>
                      <td className="whitespace-nowrap px-3 sm:px-6 py-4 hidden md:table-cell">
                        <span className="font-mono text-xs text-neutral-400">
                          {payment.payerWallet.slice(0, 6)}...{payment.payerWallet.slice(-4)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-xs sm:text-sm text-neutral-400 hidden lg:table-cell">
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
  );
}

export default function DashboardPage() {
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
      <DashboardPageContent />
    </Suspense>
  );
}


