'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { apiPost } from '@/lib/api';

// Note: Metadata for client components should be in a layout file
// Creating layout.tsx for signup page

export default function SignupPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [merchantId, setMerchantId] = useState('');
  
  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return null;
  }

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
      
      // Automatically log in the user after signup
      try {
        const loginResponse = await apiPost<{ token: string; merchant: any }>(
          '/api/auth/login',
          { email: email }
        );
        
        // Use auth context to login
        login(loginResponse.token, response.id);
        
        // Redirect to dashboard immediately
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } catch (loginError: any) {
        // If auto-login fails, show error but still show success
        console.error('Auto-login failed:', loginError);
        setError('Account created but auto-login failed. Please login manually.');
      }
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
                <p className="text-emerald-400 font-semibold mb-4">Account Created Successfully!</p>
                
                <div className="bg-neutral-800 rounded-lg p-3 mb-4">
                  <p className="text-xs text-neutral-400 mb-1">Your Merchant ID (save this for reference):</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-neutral-900 px-3 py-2 rounded text-emerald-400 text-sm break-all">
                      {merchantId}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(merchantId);
                        alert('Merchant ID copied to clipboard!');
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <p className="text-neutral-400 text-sm">
                  Logging you in and redirecting to dashboard...
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  💡 Tip: You can always login with your email address instead of Merchant ID
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
