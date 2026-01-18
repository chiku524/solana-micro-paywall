'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { apiPost, apiGet } from '@/lib/api';
import useSWR from 'swr';

interface SecurityActivity {
  type: string;
  timestamp: number;
  ip?: string;
}

function ChangePasswordSection({ token }: { token: string | null }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await apiPost('/api/security/password/change', {
        currentPassword,
        newPassword,
      }, token ?? undefined);

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-strong rounded-xl p-6 mb-6">
      <h2 className="text-2xl font-semibold text-white mb-4">Change Password</h2>
      
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-3 mb-4">
          <p className="text-emerald-400 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Current Password *
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300"
            >
              {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            New Password *
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300"
            >
              {showNewPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Confirm New Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300"
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Changing Password...' : 'Change Password'}
        </Button>
      </form>
    </div>
  );
}

function SecurityAlerts({ merchant }: { merchant?: any }) {
  if (!merchant) return null;

  const alerts: Array<{ type: 'warning' | 'info' | 'error'; message: string; action?: { label: string; onClick: () => void } }> = [];

  if (!merchant.emailVerified) {
    alerts.push({
      type: 'warning',
      message: 'Your email address is not verified. Please verify your email to secure your account.',
      action: {
        label: 'Verify Email',
        onClick: () => {
          // This will be handled by the email verification section
          document.getElementById('email-verification')?.scrollIntoView({ behavior: 'smooth' });
        },
      },
    });
  }

  if (!merchant.twoFactorEnabled) {
    alerts.push({
      type: 'info',
      message: 'Two-factor authentication is not enabled. Enable 2FA for additional security.',
      action: {
        label: 'Enable 2FA',
        onClick: () => {
          document.getElementById('2fa-section')?.scrollIntoView({ behavior: 'smooth' });
        },
      },
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-emerald-400 font-semibold">Your account security is up to date!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`rounded-lg p-4 border ${
            alert.type === 'warning'
              ? 'bg-yellow-900/20 border-yellow-700'
              : alert.type === 'error'
              ? 'bg-red-900/20 border-red-700'
              : 'bg-blue-900/20 border-blue-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {alert.type === 'warning' && (
                <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {alert.type === 'info' && (
                <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p className={`text-sm ${
                alert.type === 'warning'
                  ? 'text-yellow-400'
                  : alert.type === 'error'
                  ? 'text-red-400'
                  : 'text-blue-400'
              }`}>
                {alert.message}
              </p>
            </div>
            {alert.action && (
              <button
                onClick={alert.action.onClick}
                className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
                  alert.type === 'warning'
                    ? 'text-yellow-400 hover:bg-yellow-900/20'
                    : alert.type === 'error'
                    ? 'text-red-400 hover:bg-red-900/20'
                    : 'text-blue-400 hover:bg-blue-900/20'
                }`}
              >
                {alert.action.label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SecurityActivitySection({ token }: { token: string | null }) {
  const { data } = useSWR<{ activities: SecurityActivity[] }>(
    token ? ['/api/security/activity', token] : null,
    ([url, t]: [string, string]) => apiGet(url, t)
  );

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      password_changed: 'Password Changed',
      password_reset: 'Password Reset',
      email_verified: 'Email Verified',
      '2fa_enabled': '2FA Enabled',
      '2fa_disabled': '2FA Disabled',
      login: 'Login',
      logout: 'Logout',
    };
    return labels[type] || type;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="glass-strong rounded-xl p-6">
      <h2 className="text-2xl font-semibold text-white mb-4">Security Activity</h2>
      
      {data?.activities && data.activities.length > 0 ? (
        <div className="space-y-2">
          {data.activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
              <div>
                <p className="text-white font-medium">{getActivityLabel(activity.type)}</p>
                <p className="text-neutral-400 text-sm">{formatDate(activity.timestamp)}</p>
                {activity.ip && (
                  <p className="text-neutral-500 text-xs">IP: {activity.ip}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400">No security activity recorded yet.</p>
      )}
    </div>
  );
}

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
      await apiPost('/api/security/email-verification/request', {}, token ?? undefined);
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
      await apiPost('/api/security/2fa/verify', { code: twoFactorCode }, token ?? undefined);
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
      await apiPost('/api/security/2fa/disable', {}, token ?? undefined);
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

        {/* Security Alerts */}
        <SecurityAlerts merchant={merchantData} />

        {/* Email Verification */}
        <div id="email-verification" className="glass-strong rounded-xl p-6 mb-6">
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
        <div id="2fa-section" className="glass-strong rounded-xl p-6 mb-6">
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

              <div className="mb-4 flex justify-center">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorData.otpauthUrl)}`}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                  className="mx-auto"
                  unoptimized
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

        {/* Change Password */}
        <ChangePasswordSection token={token} />

        {/* Security Activity */}
        <SecurityActivitySection token={token} />

        {/* Session Management */}
        <SessionManagementSection />
      </main>
      <Footer />
    </div>
  );
}

function SessionManagementSection() {
  const { token, refreshToken, logout } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<{ expiresAt: number; refreshExpiresAt: number } | null>(null);

  useEffect(() => {
    if (token && refreshToken) {
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const refreshPayload = JSON.parse(atob(refreshToken.split('.')[1]));
        setTokenInfo({
          expiresAt: tokenPayload.exp * 1000,
          refreshExpiresAt: refreshPayload.exp * 1000,
        });
      } catch (error) {
        console.error('Error parsing tokens:', error);
      }
    }
  }, [token, refreshToken]);

  const formatTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const remaining = expiresAt - now;
    if (remaining < 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="glass-strong rounded-xl p-6">
      <h2 className="text-2xl font-semibold text-white mb-4">Active Sessions</h2>
      
      {tokenInfo ? (
        <div className="space-y-4">
          <div className="p-4 bg-neutral-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-300">Access Token</span>
              <span className="text-emerald-400 text-sm">
                Expires in {formatTimeRemaining(tokenInfo.expiresAt)}
              </span>
            </div>
            <p className="text-neutral-500 text-xs">
              Automatically refreshes 5 minutes before expiration
            </p>
          </div>
          
          <div className="p-4 bg-neutral-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-300">Refresh Token</span>
              <span className="text-emerald-400 text-sm">
                Expires in {formatTimeRemaining(tokenInfo.refreshExpiresAt)}
              </span>
            </div>
            <p className="text-neutral-500 text-xs">
              Used to obtain new access tokens
            </p>
          </div>
          
          <Button
            onClick={logout}
            variant="outline"
            className="w-full"
          >
            Sign Out All Sessions
          </Button>
        </div>
      ) : (
        <p className="text-neutral-400">No active session information available.</p>
      )}
    </div>
  );
}
