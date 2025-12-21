'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatSol, formatDate, truncateAddress } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    const storedMerchantId = localStorage.getItem('merchantId');
    const storedToken = localStorage.getItem('token');
    
    const urlMerchantId = searchParams.get('merchantId');
    
    if (urlMerchantId) {
      setMerchantId(urlMerchantId);
      localStorage.setItem('merchantId', urlMerchantId);
    } else if (storedMerchantId) {
      setMerchantId(storedMerchantId);
    }
    
    if (storedToken) {
      setToken(storedToken);
    }
  }, [searchParams]);
  
  const { data: stats } = useSWR(
    token ? ['/api/analytics/stats', token] : null,
    ([url, t]) => apiGet(url, t)
  );
  
  const { data: recentPayments } = useSWR(
    token ? ['/api/analytics/recent-payments', token] : null,
    ([url, t]) => apiGet(url, t)
  );
  
  const handleLogin = async () => {
    if (!merchantId) {
      const id = prompt('Enter your Merchant ID:');
      if (id) {
        setMerchantId(id);
        localStorage.setItem('merchantId', id);
      } else {
        return;
      }
    }
    
    try {
      const response = await apiPost<{ token: string; merchant: any }>(
        '/api/auth/login',
        { merchantId: merchantId || '' }
      );
      setToken(response.token);
      localStorage.setItem('token', response.token);
    } catch (error) {
      alert('Login failed. Please check your Merchant ID.');
    }
  };
  
  if (!merchantId) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="bg-neutral-900 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-4">Merchant Login</h1>
          <p className="text-neutral-400 mb-6">
            Enter your Merchant ID to access the dashboard
          </p>
          <input
            type="text"
            placeholder="Merchant ID"
            className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg mb-4"
            value={merchantId || ''}
            onChange={(e) => setMerchantId(e.target.value)}
          />
          <Button onClick={handleLogin} className="w-full">Login</Button>
        </div>
      </div>
    );
  }
  
  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="bg-neutral-900 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-4">Authenticating...</h1>
          <Button onClick={handleLogin} className="w-full">Login</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>
        
        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-neutral-900 p-6 rounded-lg">
              <p className="text-neutral-400 text-sm mb-2">Total Payments</p>
              <p className="text-3xl font-bold text-white">{stats.totalPayments}</p>
            </div>
            <div className="bg-neutral-900 p-6 rounded-lg">
              <p className="text-neutral-400 text-sm mb-2">Today</p>
              <p className="text-3xl font-bold text-white">{stats.todayPayments}</p>
            </div>
            <div className="bg-neutral-900 p-6 rounded-lg">
              <p className="text-neutral-400 text-sm mb-2">This Week</p>
              <p className="text-3xl font-bold text-white">{stats.weekPayments}</p>
            </div>
            <div className="bg-neutral-900 p-6 rounded-lg">
              <p className="text-neutral-400 text-sm mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-emerald-400">
                {formatSol(stats.totalRevenueLamports)} SOL
              </p>
            </div>
          </div>
        )}
        
        {/* Recent Payments */}
        <div className="bg-neutral-900 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Recent Payments</h2>
          {recentPayments?.payments && recentPayments.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-3 px-4 text-neutral-400">Content</th>
                    <th className="text-left py-3 px-4 text-neutral-400">Amount</th>
                    <th className="text-left py-3 px-4 text-neutral-400">Payer</th>
                    <th className="text-left py-3 px-4 text-neutral-400">Date</th>
                    <th className="text-left py-3 px-4 text-neutral-400">Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.payments.map((payment: any) => (
                    <tr key={payment.id} className="border-b border-neutral-800">
                      <td className="py-3 px-4 text-white">{payment.contentTitle}</td>
                      <td className="py-3 px-4 text-emerald-400">
                        {formatSol(payment.amountLamports)} SOL
                      </td>
                      <td className="py-3 px-4 text-neutral-300">
                        {truncateAddress(payment.payerAddress)}
                      </td>
                      <td className="py-3 px-4 text-neutral-300">
                        {formatDate(payment.confirmedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`https://solscan.io/tx/${payment.transactionSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-neutral-400">No payments yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
