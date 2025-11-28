'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { apiClient } from '../../../lib/api-client';
import { SkeletonTable } from '../../../components/ui/skeleton';
import { showSuccess, showError, showLoading, updateToast } from '../../../lib/toast';
import Link from 'next/link';
import { ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline';

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

function AnalyticsPageContent() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get('merchantId') || '';
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  const { data: stats, error, isLoading } = useSWR<DashboardStats>(
    merchantId ? `dashboard-${merchantId}` : null,
    async (): Promise<DashboardStats> => {
      if (!merchantId) throw new Error('Merchant ID required');
      return apiClient.getMerchantDashboard(merchantId) as Promise<DashboardStats>;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  );

  const handleExport = async () => {
    if (!merchantId) {
      showError('Merchant ID is required');
      return;
    }

    setExporting(true);
    const loadingToast = showLoading('Preparing export...');

    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (dateRange === 'custom') {
        if (!customStartDate || !customEndDate) {
          updateToast(loadingToast, 'Please select both start and end dates', 'error');
          setExporting(false);
          return;
        }
        startDate = customStartDate;
        endDate = customEndDate;
      } else if (dateRange !== 'all') {
        const end = new Date();
        const start = new Date();
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        start.setDate(start.getDate() - days);
        startDate = start.toISOString().split('T')[0];
        endDate = end.toISOString().split('T')[0];
      }

      updateToast(loadingToast, 'Generating CSV file...', 'loading');
      const blob = await apiClient.exportPayments(merchantId, { startDate, endDate });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-export-${merchantId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      updateToast(loadingToast, 'Export completed successfully!', 'success');
    } catch (error: any) {
      updateToast(loadingToast, `Export failed: ${error.message}`, 'error');
      showError(error.message || 'Failed to export payments');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent relative z-10 p-8">
        <div className="mx-auto max-w-7xl">
          <SkeletonTable />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-400">
            {error instanceof Error ? error.message : 'Failed to load analytics'}
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

  // Calculate growth percentages
  const weekGrowth = stats.stats.todayPayments > 0 
    ? ((stats.stats.weekPayments - stats.stats.todayPayments) / stats.stats.todayPayments * 100).toFixed(1)
    : '0';
  const monthGrowth = stats.stats.weekPayments > 0
    ? ((stats.stats.monthPayments - stats.stats.weekPayments) / stats.stats.weekPayments * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-transparent relative z-10">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="mt-2 text-neutral-400">
              Detailed insights and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-neutral-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
                />
                <span className="text-neutral-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
                />
              </div>
            )}
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={exporting || !merchantId}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Stats Grid with Growth Indicators */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <p className="text-sm font-medium text-neutral-400">Total Payments</p>
            <p className="mt-2 text-3xl font-bold text-white">{stats.stats.totalPayments}</p>
            <p className="mt-1 text-xs text-neutral-500">All time</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <p className="text-sm font-medium text-neutral-400">Today</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">{stats.stats.todayPayments}</p>
            <p className="mt-1 text-xs text-neutral-500">Last 24 hours</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <p className="text-sm font-medium text-neutral-400">This Week</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">{stats.stats.weekPayments}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {parseFloat(weekGrowth) >= 0 ? '+' : ''}{weekGrowth}% vs today
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <p className="text-sm font-medium text-neutral-400">This Month</p>
            <p className="mt-2 text-3xl font-bold text-purple-400">{stats.stats.monthPayments}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {parseFloat(monthGrowth) >= 0 ? '+' : ''}{monthGrowth}% vs week
            </p>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <p className="text-sm font-medium text-neutral-400">Total Revenue</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {formatAmount(stats.stats.totalRevenue, 'SOL')}
            </p>
            <p className="mt-1 text-xs text-neutral-500">All time earnings</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <p className="text-sm font-medium text-neutral-400">Average Payment</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              {formatAmount(stats.stats.avgPaymentAmount, 'SOL')}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Per transaction</p>
          </div>
        </div>

        {/* Recent Payments Table */}
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
                        {new Date(payment.confirmedAt).toLocaleString()}
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

export default function AnalyticsPage() {
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
      <AnalyticsPageContent />
    </Suspense>
  );
}
