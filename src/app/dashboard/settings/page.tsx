'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { apiGet, apiPut } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { Merchant } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      router.push('/dashboard');
    }
  }, [router]);
  
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
    } catch (error: any) {
      alert(error.message || 'Failed to update settings');
    }
  };
  
  if (!merchant) {
    return <div className="min-h-screen bg-neutral-950 p-12">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-900 p-6 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              defaultValue={merchant.displayName || ''}
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              defaultValue={merchant.bio || ''}
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg"
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
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg"
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
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg"
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
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg"
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
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg"
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
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg"
            />
          </div>
          
          <Button type="submit">Save Settings</Button>
        </form>
      </div>
    </div>
  );
}
