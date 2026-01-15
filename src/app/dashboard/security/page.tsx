'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { apiPost, apiGet } from '@/lib/api';
import useSWR from 'swr';

export default function SecuritySettingsPage() {
  return (
    <ProtectedRoute>
      <SecuritySettingsContent />
    </ProtectedRoute>
  );
}

function SecuritySettingsContent() {
  const { token, merchant } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ secret: string; otpauthUrl: string; backupCodes: string[] } | null>(null);

  // Fetch merchant data with security info
  const { data: merchantData, mutate } = useSWR(
    token ? ['/api/merchants/me', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );

  const handleRequestEmailVerification = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiPost('/api/security/email-verification/request', {}, token);
      setSuccess('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiPost<{ secret: string; otpauthUrl: string; backupCodes: string[] }>(
        '/api/security/2fa/enable',
        {},
        token
      );
      setTwoFactorData(data);
      setShow2FASetup(true);
      setSuccess('Scan the QR code with your authenticator app');
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiPost('/api/security/2fa/verify', { code: twoFactorCode }, token);
      setSuccess('2FA enabled successfully!');
      setShow2FASetup(false);
      setTwoFactorCode('');
      setTwoFactorData(null);
      mutate(); // Refresh merchant data
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiPost('/api/security/2fa/disable', {}, token);
      setSuccess('2FA disabled successfully');
      mutate(); // Refresh merchant data
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const emailVerified = merchantData?.emailVerified ?? false;
  const twoFactorEnabled = merchantData?.twoFactorEnabled ?? false;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="text-4xl font-bold text-white mb-8">Security Settings</h1>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4 mb-6">
            <p className="text-emerald-400 text-sm">{success}</p>
          </div>
        )}

        {/* Email Verification */}
        <div className="glass-strong rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">Email Verification</h2>
              <p className="text-neutral-400">
                {emailVerified ? (
                  <span className="text-emerald-400">✓ Your email is verified</span>
                ) : (
                  <span className="text-yellow-400">⚠ Your email is not verified</span>
                )}
              </p>
            </div>
            {!emailVerified && (
              <Button
                onClick={handleRequestEmailVerification}
                disabled={isLoading}
                variant="outline"
              >
                Send Verification Email
              </Button>
            )}
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="glass-strong rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">Two-Factor Authentication</h2>
              <p className="text-neutral-400">
                {twoFactorEnabled ? (
                  <span className="text-emerald-400">✓ 2FA is enabled</span>
                ) : (
                  <span>Add an extra layer of security to your account</span>
                )}
              </p>
            </div>
            {twoFactorEnabled ? (
              <Button
                onClick={handleDisable2FA}
                disabled={isLoading}
                variant="outline"
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                onClick={handleEnable2FA}
                disabled={isLoading}
                variant="primary"
              >
                Enable 2FA
              </Button>
            )}
          </div>

          {show2FASetup && twoFactorData && (
            <div className="mt-6 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
              <h3 className="text-lg font-semibold text-white mb-4">Setup Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-neutral-300 mb-4">
                <li>Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Enter the 6-digit code from your app to verify and enable 2FA</li>
                <li>Save your backup codes in a safe place</li>
              </ol>

              <div className="mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorData.otpauthUrl)}`}
                  alt="2FA QR Code"
                  className="mx-auto"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Enter 6-digit code from your app
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg border border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="000000"
                />
              </div>

              <div className="mb-4">
                <Button
                  onClick={handleVerify2FA}
                  disabled={isLoading || twoFactorCode.length !== 6}
                  className="w-full"
                >
                  Verify and Enable 2FA
                </Button>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                <p className="text-yellow-400 text-sm font-semibold mb-2">Backup Codes (Save these!)</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {twoFactorData.backupCodes.map((code, index) => (
                    <code key={index} className="bg-neutral-900 px-2 py-1 rounded text-emerald-400 text-sm">
                      {code}
                    </code>
                  ))}
                </div>
                <p className="text-yellow-400 text-xs">
                  These codes can be used to access your account if you lose your 2FA device. Store them securely!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Password Reset */}
        <div className="glass-strong rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-2">Password</h2>
          <p className="text-neutral-400 mb-4">
            To reset your password, use the forgot password link on the login page.
          </p>
          <a
            href="/forgot-password"
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Reset Password →
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
