import { Hono } from 'hono';
import type { Env } from '../types';
import { createJWT, verifyJWT as verifyJWTUtil } from '../lib/jwt';
import { getMerchantById, getMerchantByEmail, updateFailedLoginAttempts } from '../lib/db';
import { verifyPassword } from '../lib/password';
import { isAccountLocked, incrementFailedAttempts, resetFailedAttempts } from '../lib/security';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

const loginSchema = z.object({
  email: z.string().email().optional(),
  merchantId: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().optional(),
}).refine((data) => data.email || data.merchantId, {
  message: 'Either email or merchantId must be provided',
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

app.post('/login', async (c) => {
  try {
    // Validate bindings are available
    if (!c.env.DB) {
      return c.json({ error: 'Configuration Error', message: 'Database binding not configured' }, 500);
    }
    if (!c.env.JWT_SECRET) {
      return c.json({ error: 'Configuration Error', message: 'JWT secret not configured' }, 500);
    }
    
    const body = await c.req.json();
    const { email, merchantId, password, twoFactorCode } = loginSchema.parse(body);
    
    // Find merchant by email or merchantId
    let merchant;
    if (email) {
      merchant = await getMerchantByEmail(c.env.DB, email);
      if (!merchant) {
        return c.json({ error: 'Unauthorized', message: 'Invalid email or password' }, 401);
      }
    } else if (merchantId) {
      merchant = await getMerchantById(c.env.DB, merchantId);
      if (!merchant) {
        return c.json({ error: 'Unauthorized', message: 'Invalid merchant ID or password' }, 401);
      }
    } else {
      return c.json({ error: 'Bad Request', message: 'Either email or merchantId must be provided' }, 400);
    }
    
    // Check if account is locked
    if (isAccountLocked(merchant.lockedUntil || null)) {
      const lockoutTime = merchant.lockedUntil ? Math.ceil((merchant.lockedUntil - Date.now() / 1000) / 60) : 0;
      return c.json({ 
        error: 'Locked', 
        message: `Account is locked due to too many failed login attempts. Please try again in ${lockoutTime} minutes.` 
      }, 423);
    }
    
    // Verify password
    if (!merchant.passwordHash) {
      // Legacy account without password - require password reset or migration
      return c.json({ 
        error: 'Unauthorized', 
        message: 'This account requires a password. Please contact support or reset your password.' 
      }, 401);
    }
    
    const isPasswordValid = await verifyPassword(password, merchant.passwordHash);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const { failedLoginAttempts, lockedUntil } = incrementFailedAttempts(merchant.failedLoginAttempts || 0);
      await updateFailedLoginAttempts(c.env.DB, merchant.id, failedLoginAttempts, lockedUntil);
      
      if (lockedUntil) {
        const lockoutMinutes = Math.ceil((lockedUntil - Date.now() / 1000) / 60);
        return c.json({ 
          error: 'Locked', 
          message: `Too many failed login attempts. Account locked for ${lockoutMinutes} minutes.` 
        }, 423);
      }
      
      return c.json({ error: 'Unauthorized', message: 'Invalid email or password' }, 401);
    }
    
    // Check if 2FA is enabled
    if (merchant.twoFactorEnabled && merchant.twoFactorSecret) {
      if (!twoFactorCode) {
        return c.json({ 
          error: '2FA Required', 
          message: 'Two-factor authentication code is required' 
        }, 401);
      }
      
      // Verify 2FA code using TOTP
      if (c.env.CACHE) {
        const backupCodesKey = `2fa_backup_${merchant.id}`;
        const backupCodesData = await c.env.CACHE.get(backupCodesKey);
        
        // Check backup codes first
        if (backupCodesData) {
          const backupCodes = JSON.parse(backupCodesData) as string[];
          if (backupCodes.includes(twoFactorCode)) {
            // Valid backup code - remove it
            const codeIndex = backupCodes.indexOf(twoFactorCode);
            backupCodes.splice(codeIndex, 1);
            if (backupCodes.length > 0) {
              await c.env.CACHE.put(backupCodesKey, JSON.stringify(backupCodes), { expirationTtl: 7776000 });
            } else {
              await c.env.CACHE.delete(backupCodesKey);
            }
            // Continue with login
          } else {
            // Not a backup code, verify TOTP
            const { TOTP } = await import('otpauth');
            const totp = new TOTP({
              secret: merchant.twoFactorSecret,
              algorithm: 'SHA1',
              digits: 6,
              period: 30,
            });

            const delta = totp.validate({ token: twoFactorCode, window: 2 });
            if (delta === null) {
              return c.json({ error: 'Unauthorized', message: 'Invalid 2FA code' }, 401);
            }
          }
        } else {
          // No backup codes, verify TOTP
          const { TOTP } = await import('otpauth');
          const totp = new TOTP({
            secret: merchant.twoFactorSecret,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
          });

          const delta = totp.validate({ token: twoFactorCode, window: 2 });
          if (delta === null) {
            return c.json({ error: 'Unauthorized', message: 'Invalid 2FA code' }, 401);
          }
        }
      } else {
        // No cache, verify TOTP directly
        const { TOTP } = await import('otpauth');
        const totp = new TOTP({
          secret: merchant.twoFactorSecret,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
        });

        const delta = totp.validate({ token: twoFactorCode, window: 2 });
        if (delta === null) {
          return c.json({ error: 'Unauthorized', message: 'Invalid 2FA code' }, 401);
        }
      }
    }
    
    // Reset failed login attempts on successful login
    await updateFailedLoginAttempts(c.env.DB, merchant.id, 0, null);
    
    // Allow login for pending and active accounts (new signups are pending by default)
    if (merchant.status === 'suspended') {
      return c.json({ error: 'Forbidden', message: 'Merchant account is suspended' }, 403);
    }
    
    const jwtSecret = c.env.JWT_SECRET;
    const signJWT = createJWT(jwtSecret);
    
    // Generate access token (short-lived: 1 hour)
    const accessToken = await signJWT({
      merchantId: merchant.id,
      type: 'merchant',
      tokenType: 'access',
    }, '1h');
    
    // Generate refresh token (long-lived: 30 days)
    const refreshToken = await signJWT({
      merchantId: merchant.id,
      type: 'merchant',
      tokenType: 'refresh',
    }, '30d');
    
    // Store refresh token in KV for revocation support
    if (c.env.CACHE) {
      const refreshTokenKey = `refresh_token_${merchant.id}`;
      await c.env.CACHE.put(refreshTokenKey, refreshToken, { expirationTtl: 2592000 }); // 30 days
    }
    
    return c.json({
      token: accessToken,
      refreshToken,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        displayName: merchant.displayName,
        bio: merchant.bio,
        avatarUrl: merchant.avatarUrl,
        payoutAddress: merchant.payoutAddress,
        status: merchant.status,
        emailVerified: merchant.emailVerified || false,
        twoFactorEnabled: merchant.twoFactorEnabled || false,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// Refresh access token
app.post('/refresh', async (c) => {
  try {
    if (!c.env.JWT_SECRET || !c.env.DB || !c.env.CACHE) {
      return c.json({ error: 'Configuration Error', message: 'Required bindings not configured' }, 500);
    }

    const body = await c.req.json();
    const { refreshToken } = refreshTokenSchema.parse(body);

    // Verify refresh token
    const verifyJWT = verifyJWTUtil(c.env.JWT_SECRET);
    const payload = await verifyJWT(refreshToken);

    if (!payload || payload.tokenType !== 'refresh') {
      return c.json({ error: 'Unauthorized', message: 'Invalid refresh token' }, 401);
    }

    // Check if token is revoked
    const refreshTokenKey = `refresh_token_${payload.merchantId}`;
    const storedToken = await c.env.CACHE.get(refreshTokenKey);
    
    if (!storedToken || storedToken !== refreshToken) {
      return c.json({ error: 'Unauthorized', message: 'Refresh token has been revoked' }, 401);
    }

    // Get merchant to verify account status
    const merchant = await getMerchantById(c.env.DB, payload.merchantId);
    if (!merchant || merchant.status === 'suspended') {
      return c.json({ error: 'Forbidden', message: 'Account not found or suspended' }, 403);
    }

    // Generate new access token
    const signJWT = createJWT(c.env.JWT_SECRET);
    const accessToken = await signJWT({
      merchantId: merchant.id,
      type: 'merchant',
      tokenType: 'access',
    }, '1h');

    return c.json({
      token: accessToken,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        displayName: merchant.displayName,
        bio: merchant.bio,
        avatarUrl: merchant.avatarUrl,
        payoutAddress: merchant.payoutAddress,
        status: merchant.status,
        emailVerified: merchant.emailVerified || false,
        twoFactorEnabled: merchant.twoFactorEnabled || false,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

export default app;
