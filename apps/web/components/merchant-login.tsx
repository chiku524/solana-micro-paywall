'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../lib/api-client';
import { showSuccess, showError, showLoading, updateToast } from '../lib/toast';
import { merchantLoginSchema, merchantIdSchema, type MerchantLoginFormData, type MerchantIdFormData } from '../lib/validations/merchant';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function MerchantLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [showExistingLogin, setShowExistingLogin] = useState(false);

  // Form for creating new merchant
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: errorsCreate },
    reset: resetCreate,
  } = useForm<MerchantLoginFormData>({
    resolver: zodResolver(merchantLoginSchema),
  });

  // Form for logging in with existing merchant ID
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin },
    reset: resetLogin,
  } = useForm<MerchantIdFormData>({
    resolver: zodResolver(merchantIdSchema),
  });

  const onSubmitCreate = async (data: MerchantLoginFormData) => {
    setLoading(true);
    const loadingToast = showLoading('Creating merchant account...');
    
    try {
      const merchant = await apiClient.createMerchant({
        email: data.email,
        payoutAddress: data.payoutAddress || undefined,
      }) as any;
      setMerchantId(merchant.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('merchantId', merchant.id);
      }
      updateToast(loadingToast, `Merchant created! Redirecting to dashboard...`, 'success');
      resetCreate();
      setTimeout(() => {
        router.push(`/dashboard?merchantId=${merchant.id}`);
      }, 1000);
    } catch (err: any) {
      if (err?.status === 409) {
        const message = err?.message || 'A merchant with this email already exists.';
        updateToast(loadingToast, 'Merchant already exists. Finding your account...', 'loading');
        try {
          const merchants = await apiClient.getMerchants({ search: data.email }) as any;
          if (merchants?.data && merchants.data.length > 0) {
            const existingMerchant = merchants.data[0];
            if (typeof window !== 'undefined') {
              localStorage.setItem('merchantId', existingMerchant.id);
            }
            updateToast(loadingToast, `Found your merchant! Redirecting...`, 'success');
            resetCreate();
            setTimeout(() => {
              router.push(`/dashboard?merchantId=${existingMerchant.id}`);
            }, 1000);
          } else {
            updateToast(loadingToast, 'Could not find your merchant. Please contact support.', 'error');
          }
        } catch (findErr) {
          updateToast(loadingToast, 'Could not find your merchant. Please enter your merchant ID manually.', 'error');
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        updateToast(loadingToast, `Failed to create merchant: ${errorMessage}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitLogin = async (data: MerchantIdFormData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('merchantId', data.merchantId);
    }
    showSuccess('Logging in...');
    resetLogin();
    router.push(`/dashboard?merchantId=${data.merchantId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {showExistingLogin ? 'Login with Merchant ID' : 'Create Merchant Account'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showExistingLogin ? (
          <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
            <Input
              {...registerCreate('email')}
              label="Email"
              type="email"
              placeholder="merchant@example.com"
              error={errorsCreate.email?.message}
              fullWidth
            />
            <Input
              {...registerCreate('payoutAddress')}
              label="Payout Address (optional)"
              type="text"
              placeholder="Your Solana wallet address"
              helperText="Solana wallet address where payments will be sent"
              error={errorsCreate.payoutAddress?.message}
              fullWidth
              className="font-mono text-sm"
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              disabled={loading}
            >
              Create Account
            </Button>
            {merchantId && (
              <p className="text-sm text-emerald-400">
                Merchant created! Redirecting to dashboard...
              </p>
            )}
            <div className="pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setShowExistingLogin(true);
                  resetCreate();
                }}
                className="w-full text-sm text-neutral-400 hover:text-neutral-300"
              >
                Already have a merchant ID? Login here →
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitLogin(onSubmitLogin)} className="space-y-4">
            <Input
              {...registerLogin('merchantId')}
              label="Merchant ID"
              type="text"
              placeholder="Enter your merchant ID"
              error={errorsLogin.merchantId?.message}
              fullWidth
              className="font-mono text-sm"
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              Login to Dashboard
            </Button>
            <div className="pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setShowExistingLogin(false);
                  resetLogin();
                }}
                className="w-full text-sm text-neutral-400 hover:text-neutral-300"
              >
                ← Create new account instead
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

