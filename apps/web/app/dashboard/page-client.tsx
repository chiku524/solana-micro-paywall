'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { apiClient } from '../../lib/api-client';
import { MerchantLogin } from '../../components/merchant-login';
import { SkeletonTable } from '../../components/ui/skeleton';
import { ErrorBoundary } from '../../components/ui/error-boundary';
import { ErrorFallback } from '../../components/ui/error-fallback';
import { Navbar } from '../../components/dashboard/navbar';

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

// CRITICAL: Avoid useSearchParams() to prevent hydration mismatches
// Read from window.location.search instead, which is only available on client
function DashboardPageContent() {
  const router = useRouter();
  // CRITICAL FIX: Initialize mounted to true and use useEffect to read merchantId
  // This ensures server and client render the same initial structure
  // The server will render the loading state, and client will match it initially
  const [mounted, setMounted] = useState(true); // Start as true to match server render
  const [merchantId, setMerchantId] = useState<string>('');

  useEffect(() => {
    console.log('[Dashboard] Component mounting');
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page-client.tsx:46',message:'DashboardPageContent mount',data:{pathname:window.location.pathname,isMounted:mounted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Read merchantId from URL or localStorage after mount
    try {
      const params = new URLSearchParams(window.location.search);
      const urlMerchantId = params.get('merchantId') || '';

      if (urlMerchantId) {
        localStorage.setItem('merchantId', urlMerchantId);
        setMerchantId(urlMerchantId);
        return;
      }

      const storedMerchantId = localStorage.getItem('merchantId') || '';
      if (storedMerchantId) {
        // Only update URL if it's different to avoid unnecessary navigation
        const currentParams = new URLSearchParams(window.location.search);
        if (currentParams.get('merchantId') !== storedMerchantId) {
          router.replace(`/dashboard?merchantId=${storedMerchantId}`);
        }
        setMerchantId(storedMerchantId);
        return;
      }

      setMerchantId('');
    } catch (error) {
      console.error('[Dashboard] Error handling merchantId:', error);
      const storedMerchantId = localStorage.getItem('merchantId') || '';
      setMerchantId(storedMerchantId);
    }
  }, [router]);

  const currentMerchantId = merchantId;

  console.log('[Dashboard] Rendering. Mounted:', mounted, 'MerchantId:', currentMerchantId);

  // CRITICAL FIX: Always render the same structure - no conditional based on mounted
  // This ensures server and client render identical HTML
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page-client.tsx:98',message:'DashboardPageContent render',data:{mounted:mounted,merchantId:currentMerchantId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  return (
    <div className="min-h-screen bg-transparent relative z-10" data-page="dashboard" data-route="/dashboard">
      <DashboardContent merchantId={currentMerchantId} />
    </div>
  );
}

// Extract the main content to a separate component for cleaner code
function DashboardContent({ merchantId }: { merchantId: string }) {
  console.log('[DashboardContent] Rendering content. merchantId:', merchantId);
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page-client.tsx:115',message:'DashboardContent render',data:{merchantId:merchantId,hasMerchantId:!!merchantId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

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

  const loading = isLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent relative z-10" data-page="dashboard" data-route="/dashboard">
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

  if (!merchantId) {
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
    return (
      <div className="flex min-h-screen items-center justify-center relative z-10" data-page="dashboard" data-route="/dashboard">
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

  // CRITICAL: Use consistent date formatting to prevent hydration mismatches
  // toLocaleString() can vary between server and client based on locale/timezone
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Use ISO format with manual formatting to ensure consistency
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
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

// CRITICAL: No Suspense needed since we're not using useSearchParams anymore
// This eliminates the hydration mismatch caused by Suspense boundaries
// Wrap in ErrorBoundary at page level instead of layout level
export function DashboardPageClient() {
  // CRITICAL: Add logging to verify this client component is being called
  console.log('[DashboardPageClient] Client component rendering');
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page-client.tsx:326',message:'DashboardPageClient render start',data:{pathname:typeof window !== 'undefined' ? window.location.pathname : 'server',hasWindow:typeof window !== 'undefined',timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // CRITICAL: Add useEffect to verify component mounts
  useEffect(() => {
    console.log('[DashboardPageClient] Component mounted in useEffect');
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page-client.tsx:332',message:'DashboardPageClient mounted',data:{pathname:window.location.pathname,readyState:document.readyState},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }, []);
  
  // Add error handler to catch any errors during render
  try {
    return (
      <>
        <Navbar />
        <ErrorBoundary 
          fallback={
            <div className="min-h-screen bg-transparent relative z-10" data-page="dashboard">
              <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-red-400 mb-2">Error Boundary Caught Error</h2>
                  <p className="text-red-300 mb-4">Check console for details</p>
                  <ErrorFallback />
                </div>
              </div>
            </div>
          }
        >
          <DashboardPageContent />
        </ErrorBoundary>
      </>
    );
  } catch (error) {
    console.error('[DashboardPageClient] Error during render:', error);
    return (
      <div className="min-h-screen bg-transparent relative z-10" data-page="dashboard">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Render Error</h2>
            <p className="text-red-300 mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

