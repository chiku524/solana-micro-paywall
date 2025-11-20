'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../../lib/api-client';
import { showSuccess, showError, showLoading, updateToast } from '../../../lib/toast';
import { settingsSchema, type SettingsFormData } from '../../../lib/validations/settings';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form for settings
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      status: 'active',
    },
  });

  // Handle redirect if merchantId is in localStorage but not in URL
  useEffect(() => {
    const urlMerchantId = searchParams.get('merchantId') || '';
    
    if (urlMerchantId && typeof window !== 'undefined') {
      localStorage.setItem('merchantId', urlMerchantId);
      return;
    }
    
    if (typeof window !== 'undefined' && !urlMerchantId) {
      const storedMerchantId = localStorage.getItem('merchantId') || '';
      if (storedMerchantId) {
        router.replace(`/dashboard/settings?merchantId=${storedMerchantId}`);
        return;
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    const urlMerchantId = searchParams.get('merchantId') || '';
    const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
    const currentMerchantId = urlMerchantId || storedMerchantId;

    if (!currentMerchantId) {
      setLoading(false);
      return;
    }

    async function loadMerchant() {
      try {
        const data = await apiClient.getMerchant(currentMerchantId) as any;
        setMerchant(data);
        reset({
          payoutAddress: data.payoutAddress || '',
          status: (data.status || 'active') as 'pending' | 'active' | 'suspended' | 'kyc_required',
        });
      } catch (err: any) {
        console.error('Failed to load merchant:', err);
      } finally {
        setLoading(false);
      }
    }

    if (urlMerchantId) {
      loadMerchant();
    }
  }, [searchParams, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    const urlMerchantId = searchParams.get('merchantId') || '';
    const storedMerchantId = typeof window !== 'undefined' ? localStorage.getItem('merchantId') || '' : '';
    const merchantId = urlMerchantId || storedMerchantId;

    if (!merchantId) {
      showError('Merchant ID is missing. Please refresh the page.');
      return;
    }

    setSaving(true);
    const loadingToast = showLoading('Saving settings...');
    try {
      await apiClient.updateMerchant(merchantId, data);
      updateToast(loadingToast, 'Settings saved successfully!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      updateToast(loadingToast, `Failed to save settings: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
          <p className="text-neutral-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-2 text-neutral-400">Manage your merchant account settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Merchant Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Email"
                type="email"
                value={merchant?.email || ''}
                disabled
                helperText="Email cannot be changed"
                fullWidth
              />
              <Input
                {...register('payoutAddress')}
                label="Payout Address"
                type="text"
                placeholder="Your Solana wallet address"
                helperText="Solana wallet address where payments will be sent"
                error={errors.payoutAddress?.message}
                fullWidth
                className="font-mono text-sm"
              />
              <div className="flex flex-col">
                <label className="mb-1 block text-sm font-medium text-neutral-300">Status</label>
                <select
                  {...register('status')}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="kyc_required">KYC Required</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-400">{errors.status.message}</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  disabled={saving}
                >
                  Save Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto" />
            <p className="text-neutral-400">Loading...</p>
          </div>
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}

