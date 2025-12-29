'use client';

import { Suspense } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { formatSol, formatDate, truncateAddress } from '@/lib/utils';

function PaymentsContent() {
  const { token } = useAuth();
  
  const { data: payments, isLoading } = useSWR<{ payments: any[] }>(
    token ? ['/api/analytics/recent-payments', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-neutral-950 flex flex-col">
        <Navbar />
        <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Payment History</h1>
              <p className="text-neutral-400">View all your payment transactions</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="glass-strong rounded-xl p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
              <p className="text-neutral-400">Loading payments...</p>
            </div>
          ) : payments?.payments && payments.payments.length > 0 ? (
            <div className="glass-strong rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left py-4 px-6 text-neutral-400 font-semibold">Content</th>
                      <th className="text-left py-4 px-6 text-neutral-400 font-semibold">Amount</th>
                      <th className="text-left py-4 px-6 text-neutral-400 font-semibold">Payer</th>
                      <th className="text-left py-4 px-6 text-neutral-400 font-semibold">Date</th>
                      <th className="text-left py-4 px-6 text-neutral-400 font-semibold">Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.payments.map((payment: any) => (
                      <tr key={payment.id} className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors">
                        <td className="py-4 px-6 text-white">{payment.contentTitle || 'N/A'}</td>
                        <td className="py-4 px-6 text-emerald-400 font-semibold">
                          {formatSol(payment.amountLamports)} SOL
                        </td>
                        <td className="py-4 px-6 text-neutral-300">
                          {truncateAddress(payment.payerAddress)}
                        </td>
                        <td className="py-4 px-6 text-neutral-300">
                          {formatDate(payment.confirmedAt)}
                        </td>
                        <td className="py-4 px-6">
                          <a
                            href={`https://solscan.io/tx/${payment.transactionSignature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                          >
                            View on Solscan
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-strong p-12 rounded-xl text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No Payments Yet</h2>
              <p className="text-neutral-400 mb-6">You haven&apos;t received any payments yet.</p>
              <Link href="/dashboard/contents">
                <Button variant="primary">Create Content</Button>
              </Link>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  );
}

