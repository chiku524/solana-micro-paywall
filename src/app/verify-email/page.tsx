'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { apiPost } from '@/lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      handleVerify();
    } else {
      setError('Invalid verification token');
    }
  }, [token]);

  const handleVerify = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError('');

    try {
      await apiPost('/api/security/email-verification/verify', {
        token,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-neutral-900 p-8 rounded-lg max-w-md w-full shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Verify Email</h1>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
              <p className="text-neutral-400">Verifying your email...</p>
            </div>
          ) : success ? (
            <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
              <p className="text-emerald-400 font-semibold">Email verified successfully!</p>
              <p className="text-neutral-400 text-sm mt-2">Redirecting to dashboard...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm"
              >
                Go to Dashboard
              </button>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
