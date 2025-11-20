'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { apiClient } from '../lib/api-client';
import { DashboardProviders } from '../components/dashboard-providers';

// Dynamically import WalletMultiButton to prevent hydration errors
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [merchantId, setMerchantId] = useState<string | null>(null);

  async function handleCreateMerchant() {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const merchant = await apiClient.createMerchant({
        email,
        payoutAddress: payoutAddress || undefined,
      });
      setMerchantId(merchant.id);
      // Store merchantId in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('merchantId', merchant.id);
      }
      alert(`Merchant created! ID: ${merchant.id}`);
      router.push(`/dashboard?merchantId=${merchant.id}`);
    } catch (err: any) {
      // Handle 409 Conflict - merchant already exists
      if (err?.status === 409) {
        const message = err?.message || 'A merchant with this email already exists.';
        const shouldFindMerchant = confirm(`${message}\n\nWould you like to find your merchant ID?`);
        if (shouldFindMerchant) {
          // Try to find merchant by email
          try {
            const merchants = await apiClient.getMerchants({ search: email });
            if (merchants?.data && merchants.data.length > 0) {
              const existingMerchant = merchants.data[0];
              if (typeof window !== 'undefined') {
                localStorage.setItem('merchantId', existingMerchant.id);
              }
              alert(`Found your merchant! ID: ${existingMerchant.id}`);
              router.push(`/dashboard?merchantId=${existingMerchant.id}`);
            } else {
              alert('Could not find your merchant. Please contact support.');
            }
          } catch (findErr) {
            alert('Could not find your merchant. Please enter your merchant ID manually on the dashboard.');
          }
        }
      } else {
        alert(`Failed to create merchant: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardProviders>
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold">Solana Micro-Paywall</h1>
          <p className="text-lg text-neutral-300">
            Manage pay-per-use access, view payments, and configure your publisher widgets.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
            <h2 className="text-xl font-semibold mb-4">Create Merchant Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
                  placeholder="merchant@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Payout Address (optional)</label>
                <input
                  type="text"
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white font-mono text-sm"
                  placeholder="Your Solana wallet address"
                />
              </div>
              <button
                onClick={handleCreateMerchant}
                disabled={loading || !email}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
              {merchantId && (
                <p className="text-sm text-emerald-400">
                  Merchant created! Redirecting to dashboard...
                </p>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
            <h2 className="text-xl font-semibold">Access Dashboard</h2>
            <p className="mt-2 text-neutral-300 mb-4">
              If you already have a merchant account, use the merchant ID to access your dashboard.
            </p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter Merchant ID"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const id = (e.target as HTMLInputElement).value.trim();
                    if (id) {
                      // Store in localStorage
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('merchantId', id);
                      }
                      router.push(`/dashboard?merchantId=${id}`);
                    }
                  }
                }}
                onChange={(e) => {
                  // Also store on change for better UX
                  const id = e.target.value.trim();
                  if (id && typeof window !== 'undefined') {
                    localStorage.setItem('merchantId', id);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Enter Merchant ID"]') as HTMLInputElement;
                  const id = input?.value.trim();
                  if (id) {
                    // Store in localStorage
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('merchantId', id);
                    }
                    router.push(`/dashboard?merchantId=${id}`);
                  }
                }}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-medium text-emerald-950 transition hover:bg-emerald-400"
              >
                Go to Dashboard
              </button>
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
          <h2 className="text-xl font-semibold mb-4">Documentation</h2>
          <p className="text-neutral-300 mb-4">
            Explore architecture decisions, API contracts, and integration guides for publishers.
          </p>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-4 py-2 font-medium text-neutral-100 transition hover:bg-neutral-800"
          >
            View Documentation
          </Link>
        </section>
      </main>
    </DashboardProviders>
  );
}

