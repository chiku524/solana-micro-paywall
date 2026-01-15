/**
 * Security utilities for password reset, email verification, and account lockout
 */

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a 6-digit code for 2FA
 */
export function generate2FACode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Check if account is locked
 */
export function isAccountLocked(lockedUntil: number | null): boolean {
  if (!lockedUntil) return false;
  return Date.now() / 1000 < lockedUntil;
}

/**
 * Calculate lockout duration (exponential backoff)
 */
export function calculateLockoutDuration(failedAttempts: number): number {
  // Lock for 15 minutes after 5 attempts, 30 minutes after 10, 1 hour after 15
  if (failedAttempts >= 15) return 3600; // 1 hour
  if (failedAttempts >= 10) return 1800; // 30 minutes
  if (failedAttempts >= 5) return 900; // 15 minutes
  return 0;
}

/**
 * Reset failed login attempts
 */
export function resetFailedAttempts(): { failedLoginAttempts: number; lockedUntil: number | null } {
  return {
    failedLoginAttempts: 0,
    lockedUntil: null,
  };
}

/**
 * Increment failed login attempts and calculate lockout
 */
export function incrementFailedAttempts(currentAttempts: number): {
  failedLoginAttempts: number;
  lockedUntil: number | null;
} {
  const newAttempts = currentAttempts + 1;
  const lockoutDuration = calculateLockoutDuration(newAttempts);
  
  return {
    failedLoginAttempts: newAttempts,
    lockedUntil: lockoutDuration > 0 ? Math.floor(Date.now() / 1000) + lockoutDuration : null,
  };
}
