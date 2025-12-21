'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [merchantId, setMerchantId] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await apiPost<{ id: string; email: string }>(
        '/api/merchants',
        {
          email,
          payoutAddress: payoutAddress || undefined,
        }
      );

      setMerchantId(response.id);
      setSuccess(true);
      
      // Store merchant ID for auto-login
      localStorage.setItem('merchantId', response.id);
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push(`/dashboard?merchantId=${response.id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-neutral-900 p-8 rounded-lg max-w-md w-full shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-neutral-400 mb-6">
            Sign up to start monetizing your content with Solana payments
          </p>

          {success ? (
            <div className="space-y-4">
              <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
                <p className="text-emerald-400 font-semibold mb-2">Account Created Successfully!</p>
                <p className="text-neutral-300 text-sm mb-4">
                  Your Merchant ID: <code className="bg-neutral-800 px-2 py-1 rounded text-emerald-400">{merchantId}</code>
                </p>
                <p className="text-neutral-400 text-sm">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="payoutAddress" className="block text-sm font-medium text-neutral-300 mb-2">
                  Solana Payout Address (Optional)
                </label>
                <input
                  id="payoutAddress"
                  type="text"
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                  placeholder="Your Solana wallet address"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  You can add this later in your dashboard settings
                </p>
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
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <p className="text-center text-sm text-neutral-400">
                Already have an account?{' '}
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
