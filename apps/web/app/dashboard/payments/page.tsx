'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { apiClient } from '../../../lib/api-client';
import { SkeletonTable } from '../../../components/ui/skeleton';
import { logger } from '../../../lib/logger';

interface Payment {
  id: string;
  txSignature: string;
  amount: string;
  currency: string;
  payerWallet: string;
  confirmedAt: string;
  content: string;
  intent?: {
    id: string;
    memo: string;
    status: string;
  };
}

interface PaymentHistoryResponse {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function PaymentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const merchantId = searchParams.get('merchantId') || '';

  // Get payment history
  const { data, error, isLoading, mutate } = useSWR<PaymentHistoryResponse>(
    merchantId ? `payments-${merchantId}-${page}` : null,
    async (): Promise<PaymentHistoryResponse> => {
      if (!merchantId) throw new Error('Merchant ID required');
      // For now, we'll use the dashboard stats endpoint and extend it
      // In a real implementation, you'd have a dedicated payments endpoint
      const dashboard = await apiClient.getMerchantDashboard(merchantId) as any;
      return {
        payments: dashboard.recentPayments || [],
        pagination: {
          page: 1,
          limit: 10,
          total: dashboard.stats.totalPayments || 0,
          totalPages: Math.ceil((dashboard.stats.totalPayments || 0) / 10),
        },
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  useEffect(() => {
    if (!merchantId && typeof window !== 'undefined') {
      const storedMerchantId = localStorage.getItem('merchantId') || '';
      if (storedMerchantId) {
        router.replace(`/dashboard/payments?merchantId=${storedMerchantId}`);
      }
    }
  }, [merchantId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent relative z-10 p-8">
        <div className="mx-auto max-w-7xl">
          <SkeletonTable />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-400">
            {error instanceof Error ? error.message : 'Failed to load payment history'}
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-emerald-950 transition hover:bg-emerald-400"
          >
            Go to Dashboard
          </Link>
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
    <div className="min-h-screen bg-transparent relative z-10">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Payment History</h1>
          <p className="mt-2 text-neutral-400">
            View all your payment transactions
          </p>
        </div>

        {/* Payment Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <p className="text-sm font-medium text-neutral-400">Total Payments</p>
            <p className="mt-2 text-3xl font-bold text-white">{data.pagination.total}</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <p className="text-sm font-medium text-neutral-400">Page</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {data.pagination.page} / {data.pagination.totalPages}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <p className="text-sm font-medium text-neutral-400">Showing</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              {data.payments.length} payments
            </p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60">
          <div className="border-b border-neutral-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">All Payments</h2>
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
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-900/60">
                {data.payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-400">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  data.payments.map((payment) => (
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
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <a
                          href={`https://solscan.io/tx/${payment.txSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          View →
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="border-t border-neutral-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700"
                >
                  Previous
                </button>
                <span className="text-neutral-300">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
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
      <PaymentsPageContent />
    </Suspense>
  );
}

