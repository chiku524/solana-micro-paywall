'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { formatSol, formatDate, truncateAddress } from '@/lib/utils';
import type { PaymentStats } from '@/types';

function DashboardLogin() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [useEmail, setUseEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const urlMerchantId = searchParams.get('merchantId');
    if (urlMerchantId) {
      setMerchantId(urlMerchantId);
      setUseEmail(false);
    }
  }, [searchParams]);
  
  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const loginData = useEmail && email
        ? { email }
        : { merchantId: merchantId || '' };
      
      if (!loginData.email && !loginData.merchantId) {
        setError('Please enter your email or Merchant ID');
        setIsLoading(false);
        return;
      }
      
      const response = await apiPost<{ token: string; merchant: any }>(
        '/api/auth/login',
        loginData
      );
      
      login(response.token, response.merchant.id);
    } catch (error: any) {
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-strong p-8 rounded-xl max-w-md w-full shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Merchant Login</h1>
          <p className="text-neutral-400 mb-6">
            Sign in with your email or Merchant ID
          </p>
          
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {/* Toggle between email and Merchant ID */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setUseEmail(true)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                useEmail
                  ? 'bg-gradient-primary text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setUseEmail(false)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !useEmail
                  ? 'bg-gradient-primary text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              Merchant ID
            </button>
          </div>
          
          {useEmail ? (
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg mb-4 border border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
              disabled={isLoading}
            />
          ) : (
            <input
              type="text"
              placeholder="Merchant ID"
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg mb-4 border border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
              disabled={isLoading}
            />
          )}
          
          <Button 
            onClick={handleLogin} 
            className="w-full mb-4" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <p className="text-center text-sm text-neutral-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DashboardContent() {
  const { token, merchantId } = useAuth();
  
  const { data: stats } = useSWR<PaymentStats>(
    token ? ['/api/analytics/stats', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );
  
  const { data: recentPayments } = useSWR<{ payments: any[] }>(
    token ? ['/api/analytics/recent-payments', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-neutral-950 flex flex-col">
        <Navbar />
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
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }>
        <DashboardLogin />
      </Suspense>
    );
  }
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
