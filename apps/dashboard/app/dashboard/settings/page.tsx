'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '../../../components/dashboard/navbar';
import { apiClient } from '../../../lib/api-client';
import { DashboardProviders } from '../../../components/dashboard-providers';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get('merchantId') || '';
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    payoutAddress: '',
    status: 'active',
  });

  useEffect(() => {
    if (!merchantId) {
      setLoading(false);
      return;
    }

    async function loadMerchant() {
      try {
        const data = await apiClient.getMerchant(merchantId);
        setMerchant(data);
        setSettings({
          payoutAddress: data.payoutAddress || '',
          status: data.status || 'active',
        });
      } catch (err: any) {
        console.error('Failed to load merchant:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMerchant();
  }, [merchantId]);

  async function handleSave() {
    setSaving(true);
    try {
      await apiClient.updateMerchant(merchantId, settings);
      alert('Settings saved successfully!');
    } catch (err) {
      alert(`Failed to save settings: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardProviders>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
            <p className="text-neutral-400">Loading settings...</p>
          </div>
        </div>
      </DashboardProviders>
    );
  }

  return (
    <DashboardProviders>
      <Navbar />
      <div className="min-h-screen bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="mt-2 text-neutral-400">Manage your merchant account settings</p>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300">Email</label>
                <input
                  type="email"
                  value={merchant?.email || ''}
                  disabled
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400"
                />
                <p className="mt-1 text-xs text-neutral-500">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300">Payout Address</label>
                <input
                  type="text"
                  value={settings.payoutAddress}
                  onChange={(e) => setSettings({ ...settings, payoutAddress: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
                  placeholder="Your Solana wallet address"
                />
                <p className="mt-1 text-xs text-neutral-500">Solana wallet address where payments will be sent</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300">Status</label>
                <select
                  value={settings.status}
                  onChange={(e) => setSettings({ ...settings, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="kyc_required">KYC Required</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardProviders>
  );
}

