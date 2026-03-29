'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { apiGet, apiPut, apiPost, apiDelete } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { showToast } from '@/lib/toast';
import type { Merchant } from '@/types';

interface WebhookDelivery {
  id: string;
  url: string;
  status: string;
  httpStatus: number | null;
  responsePreview: string | null;
  attempt: number;
  createdAt: number;
  purchaseId: string;
}

interface ApiKeyRow {
  id: string;
  keyPrefix: string;
  label: string | null;
  createdAt: number;
  lastUsedAt: number | null;
}

export default function SettingsPage() {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);

  const { data: merchant, mutate } = useSWR<Merchant>(
    token ? ['/api/merchants/me', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );

  const { data: deliveriesData, mutate: mutateDeliveries } = useSWR<{ deliveries: WebhookDelivery[] }>(
    token ? ['/api/merchants/me/webhook-deliveries', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );

  const { data: keysData, mutate: mutateKeys } = useSWR<{ keys: ApiKeyRow[] }>(
    token ? ['/api/developer-keys', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);
    try {
      await apiPut(
        '/api/merchants/me',
        {
          displayName: formData.get('displayName'),
          bio: formData.get('bio'),
          payoutAddress: formData.get('payoutAddress'),
          webhookUrl: formData.get('webhookUrl'),
          webhookSecret: formData.get('webhookSecret'),
          refundPolicyText: formData.get('refundPolicyText'),
          supportContactEmail: formData.get('supportContactEmail'),
          twitterUrl: formData.get('twitterUrl'),
          telegramUrl: formData.get('telegramUrl'),
          discordUrl: formData.get('discordUrl'),
          githubUrl: formData.get('githubUrl'),
        },
        token || undefined
      );
      mutate();
      mutateDeliveries();
      showToast.success('Settings updated successfully');
    } catch (error: unknown) {
      showToast.error(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createApiKey = async () => {
    const label = window.prompt('Label for this key (optional)') || undefined;
    try {
      const res = await apiPost<{ id: string; secret: string; keyPrefix: string }>(
        '/api/developer-keys',
        { label },
        token || undefined
      );
      setNewKeySecret(res.secret);
      mutateKeys();
      showToast.success('API key created. Copy it now — it will not be shown again.');
    } catch (e: unknown) {
      showToast.error(e instanceof Error ? e.message : 'Failed to create key');
    }
  };

  const revokeKey = async (id: string) => {
    if (!window.confirm('Revoke this API key?')) return;
    try {
      await apiDelete(`/api/developer-keys/${id}`, token || undefined);
      mutateKeys();
      showToast.success('Key revoked');
    } catch (e: unknown) {
      showToast.error(e instanceof Error ? e.message : 'Failed to revoke');
    }
  };

  if (!merchant) {
    return <div className="min-h-screen p-12">Loading...</div>;
  }

  const deliveries = deliveriesData?.deliveries ?? [];
  const keys = keysData?.keys ?? [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">Settings</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Profile, webhooks, developer keys, and buyer-facing policy
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-xl shadow-lg mb-10">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Display Name</label>
              <input
                type="text"
                name="displayName"
                defaultValue={merchant.displayName || ''}
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Bio</label>
              <textarea
                name="bio"
                defaultValue={merchant.bio || ''}
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Payout address</label>
              <input
                type="text"
                name="payoutAddress"
                defaultValue={merchant.payoutAddress || ''}
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Webhook URL (HTTPS)</label>
              <input
                type="url"
                name="webhookUrl"
                defaultValue={merchant.webhookUrl || ''}
                placeholder="https://example.com/micropaywall-webhook"
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Signed with HMAC-SHA256 using your webhook secret. Header: X-Micropaywall-Signature: sha256=&lt;hex&gt;
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Webhook secret</label>
              <input
                type="password"
                name="webhookSecret"
                autoComplete="off"
                defaultValue={merchant.webhookSecret || ''}
                placeholder="Rotate periodically"
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Refund / dispute policy (public)</label>
              <textarea
                name="refundPolicyText"
                defaultValue={merchant.refundPolicyText || ''}
                rows={5}
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
                placeholder="How buyers can request help, expected response times, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Support contact email (public)</label>
              <input
                type="email"
                name="supportContactEmail"
                defaultValue={merchant.supportContactEmail || ''}
                placeholder="support@yourdomain.com"
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Twitter URL</label>
              <input
                type="url"
                name="twitterUrl"
                defaultValue={merchant.twitterUrl || ''}
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Telegram URL</label>
              <input
                type="url"
                name="telegramUrl"
                defaultValue={merchant.telegramUrl || ''}
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Discord URL</label>
              <input
                type="url"
                name="discordUrl"
                defaultValue={merchant.discordUrl || ''}
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">GitHub URL</label>
              <input
                type="url"
                name="githubUrl"
                defaultValue={merchant.githubUrl || ''}
                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save settings'}
            </Button>
          </form>

          <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-xl shadow-lg mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Developer API keys</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Use header <code className="text-emerald-600 dark:text-emerald-400">X-Api-Key</code> on{' '}
              <code className="text-emerald-600 dark:text-emerald-400">/api/payments/*</code> for higher rate limits.
            </p>
            {newKeySecret && (
              <div className="mb-4 p-3 rounded-lg bg-amber-950/40 border border-amber-800 text-amber-200 text-sm break-all">
                <strong>Copy now:</strong> {newKeySecret}
              </div>
            )}
            <Button type="button" variant="outline" className="mb-4" onClick={() => void createApiKey()}>
              Create API key
            </Button>
            <ul className="space-y-2 text-sm">
              {keys.length === 0 && <li className="text-neutral-500">No keys yet.</li>}
              {keys.map((k) => (
                <li
                  key={k.id}
                  className="flex flex-wrap items-center justify-between gap-2 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2"
                >
                  <span className="font-mono text-neutral-800 dark:text-neutral-200">
                    {k.keyPrefix}… {k.label ? `(${k.label})` : ''}
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => void revokeKey(k.id)}>
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Webhook delivery log</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => void mutateDeliveries()}>
                Refresh
              </Button>
            </div>
            <div className="overflow-x-auto text-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 text-neutral-500">
                    <th className="py-2 pr-2">Time</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2">HTTP</th>
                    <th className="py-2">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-neutral-500">
                        No deliveries recorded yet.
                      </td>
                    </tr>
                  )}
                  {deliveries.map((d) => (
                    <tr key={d.id} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-2 whitespace-nowrap">
                        {new Date(d.createdAt * 1000).toLocaleString()}
                      </td>
                      <td className="py-2 pr-2">{d.status}</td>
                      <td className="py-2 pr-2">{d.httpStatus ?? '—'}</td>
                      <td className="py-2 max-w-xs truncate font-mono text-xs">{d.url}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
