'use client';

import useSWR from 'swr';
import { apiGet, apiPut } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import type { Merchant } from '@/types';

export default function SettingsPage() {
  const { token } = useAuth();
  
  const { data: merchant, mutate } = useSWR<Merchant>(
    token ? ['/api/merchants/me', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await apiPut(
        '/api/merchants/me',
        {
          displayName: formData.get('displayName'),
          bio: formData.get('bio'),
          payoutAddress: formData.get('payoutAddress'),
          twitterUrl: formData.get('twitterUrl'),
          telegramUrl: formData.get('telegramUrl'),
          discordUrl: formData.get('discordUrl'),
          githubUrl: formData.get('githubUrl'),
        },
        token || undefined
      );
      mutate();
      alert('Settings updated successfully');
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to update settings');
    }
  };
  
  if (!merchant) {
    return <div className="min-h-screen p-12">Loading...</div>;
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">Settings</h1>
          <a
            href="/dashboard/security"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            Security Settings →
          </a>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-xl shadow-lg">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              defaultValue={merchant.displayName || ''}
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              defaultValue={merchant.bio || ''}
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Payout Address (Solana Wallet)
            </label>
            <input
              type="text"
              name="payoutAddress"
              defaultValue={merchant.payoutAddress || ''}
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Twitter URL
            </label>
            <input
              type="url"
              name="twitterUrl"
              defaultValue={merchant.twitterUrl || ''}
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Telegram URL
            </label>
            <input
              type="url"
              name="telegramUrl"
              defaultValue={merchant.telegramUrl || ''}
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Discord URL
            </label>
            <input
              type="url"
              name="discordUrl"
              defaultValue={merchant.discordUrl || ''}
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              GitHub URL
            </label>
            <input
              type="url"
              name="githubUrl"
              defaultValue={merchant.githubUrl || ''}
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
            />
          </div>
          
          <Button type="submit">Save Settings</Button>
        </form>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
