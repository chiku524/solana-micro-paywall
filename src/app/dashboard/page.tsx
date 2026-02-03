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
import { getErrorMessage } from '@/lib/get-error-message';
import { getExplorerTxUrl, DEFAULT_CHAIN } from '@/lib/chains';
import type { PaymentStats, LoginResponse, RecentPayment } from '@/types';

function DashboardLogin() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [password, setPassword] = useState('');
  const [useEmail, setUseEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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
    
    if (!password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }
    
    try {
      const loginData = useEmail && email
        ? { email, password }
        : { merchantId: merchantId || '', password };
      
      if ((!loginData.email && !loginData.merchantId) || !loginData.password) {
        setError('Please enter your email or Merchant ID and password');
        setIsLoading(false);
        return;
      }
      
      const response = await apiPost<LoginResponse>(
        '/api/auth/login',
        loginData
      );
      
      login(response.token, response.refreshToken, response.merchant.id);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Login failed. Please check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-strong p-8 rounded-xl max-w-md w-full shadow-xl">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Merchant Login</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
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
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-700'
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
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              Merchant ID
            </button>
          </div>
          
          {useEmail ? (
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg mb-4 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
              disabled={isLoading}
            />
          ) : (
            <input
              type="text"
              placeholder="Merchant ID"
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg mb-4 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
              disabled={isLoading}
            />
          )}
          
          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          
          <Button 
            onClick={handleLogin} 
            className="w-full mb-4" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <p className="text-center text-sm text-neutral-400">
            <Link href="/forgot-password" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors block mb-2">
              Forgot password?
            </Link>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
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
  
  const { data: recentPayments } = useSWR<{ payments: RecentPayment[] }>(
    token ? ['/api/analytics/recent-payments', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">Dashboard</h1>
              <p className="text-neutral-600 dark:text-neutral-400">Manage your content and track your earnings</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Link href="/dashboard/contents">
                <Button variant="primary">Manage Content</Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="outline">Settings</Button>
              </Link>
            </div>
          </div>
        
        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="glass-strong p-6 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">Total Payments</p>
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalPayments}</p>
              <p className="text-xs text-neutral-500 mt-1">All time</p>
            </div>
            <div className="glass-strong p-6 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">Today</p>
                <div className="w-10 h-10 rounded-lg bg-gradient-secondary flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stats.todayPayments}</p>
              <p className="text-xs text-neutral-500 mt-1">Last 24 hours</p>
            </div>
            <div className="glass-strong p-6 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">This Week</p>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stats.weekPayments}</p>
              <p className="text-xs text-neutral-500 mt-1">Last 7 days</p>
            </div>
            <div className="glass-strong p-6 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">Total Revenue</p>
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatSol(stats.totalRevenueLamports)} SOL
              </p>
              <p className="text-xs text-neutral-500 mt-1">All time earnings</p>
            </div>
          </div>
        )}
        
        {/* Recent Payments */}
        <div className="glass-strong rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Recent Payments</h2>
            <Link href="/dashboard/payments">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          {recentPayments?.payments && recentPayments.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400">Content</th>
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400">Amount</th>
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400">Payer</th>
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400">Date</th>
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400">Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-neutral-800">
                      <td className="py-3 px-4 text-white">{payment.contentTitle}</td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">
                        {formatSol(payment.amountLamports)} SOL
                      </td>
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                        {truncateAddress(payment.payerAddress)}
                      </td>
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                        {formatDate(payment.confirmedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={getExplorerTxUrl(payment.chain ?? DEFAULT_CHAIN, payment.transactionSignature)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 hover:underline"
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neutral-900 dark:text-white">Loading...</div>
        </div>
      }>
        <DashboardLogin />
      </Suspense>
    );
  }
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neutral-900 dark:text-white">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
