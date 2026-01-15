'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await apiPost('/api/security/password-reset/request', {
        email,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-neutral-900 p-8 rounded-lg max-w-md w-full shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
          <p className="text-neutral-400 mb-6">
            Enter your email address and we'll send you a link to reset your password
          </p>

          {success ? (
            <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
              <p className="text-emerald-400 font-semibold">Password reset link sent!</p>
              <p className="text-neutral-400 text-sm mt-2">
                If an account with that email exists, a password reset link has been sent.
                Please check your email.
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full mt-4"
                variant="outline"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <p className="text-center text-sm text-neutral-400">
                Remember your password?{' '}
                <a href="/dashboard" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Sign in
                </a>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
