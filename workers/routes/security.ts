import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { getMerchantByEmail, getMerchantByPasswordResetToken, getMerchantByEmailVerificationToken, updateMerchantPassword, setPasswordResetToken, verifyEmail, setEmailVerificationToken, setTwoFactorSecret, getMerchantById } from '../lib/db';
import { hashPassword, verifyPassword } from '../lib/password';
import { generateSecureToken, generate2FACode } from '../lib/security';
import { sendEmail, generatePasswordResetEmail, generateEmailVerificationEmail } from '../lib/email';
import { TOTP } from 'otpauth';
import { z } from 'zod';
import { checkRateLimit, getRateLimitKey } from '../lib/rate-limit';

const app = new Hono<{ Bindings: Env }>();

// Request password reset
const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

app.post('/password-reset/request', async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ error: 'Configuration Error', message: 'Database binding not configured' }, 500);
    }
    if (!c.env.CACHE) {
      return c.json({ error: 'Configuration Error', message: 'KV cache binding not configured' }, 500);
    }

    // Rate limiting
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = getRateLimitKey(ip, 'password-reset-request');
    const rateLimit = await checkRateLimit(c.env.CACHE, rateLimitKey, { limit: 3, windowSeconds: 3600 });
    
    if (!rateLimit.allowed) {
      return c.json(
        { error: 'Too Many Requests', message: 'Too many password reset requests. Please try again later.' },
        429,
        { 'Retry-After': String(rateLimit.resetAt - Math.floor(Date.now() / 1000)) }
      );
    }

    const body = await c.req.json();
    const { email } = requestPasswordResetSchema.parse(body);

    const merchant = await getMerchantByEmail(c.env.DB, email);
    if (!merchant) {
      // Don't reveal if email exists for security
      return c.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = generateSecureToken(32);
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    await setPasswordResetToken(c.env.DB, email, resetToken, expiresAt);

    // Send email with reset link
    const resetUrl = `${c.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const { subject, html, text } = generatePasswordResetEmail(resetUrl);
    
    try {
      await sendEmail(c.env, {
        to: email,
        subject,
        html,
        text,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email fails - security best practice
    }

    return c.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// Reset password with token
const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

app.post('/password-reset/reset', async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ error: 'Configuration Error', message: 'Database binding not configured' }, 500);
    }

    const body = await c.req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const merchant = await getMerchantByPasswordResetToken(c.env.DB, token);
    if (!merchant || !merchant.passwordResetExpiresAt) {
      return c.json({ error: 'Invalid', message: 'Invalid or expired reset token' }, 400);
    }

    // Check if token expired
    if (Date.now() / 1000 > merchant.passwordResetExpiresAt) {
      return c.json({ error: 'Expired', message: 'Reset token has expired' }, 400);
    }

    // Validate password strength
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return c.json({ 
        error: 'Bad Request', 
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
      }, 400);
    }

    // Hash and update password
    const passwordHash = await hashPassword(password);
    await updateMerchantPassword(c.env.DB, merchant.id, passwordHash);

    return c.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// Request email verification
app.post('/email-verification/request', authMiddleware, async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ error: 'Configuration Error', message: 'Database binding not configured' }, 500);
    }

    const merchantId = c.get('merchantId');
    const merchant = await getMerchantById(c.env.DB, merchantId);

    if (!merchant) {
      return c.json({ error: 'Not Found', message: 'Merchant not found' }, 404);
    }

    if (merchant.emailVerified) {
      return c.json({ message: 'Email is already verified' });
    }

    // Generate verification token
    const verificationToken = generateSecureToken(32);
    await setEmailVerificationToken(c.env.DB, merchantId, verificationToken);

    // Send email with verification link
    const verificationUrl = `${c.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const { subject, html, text } = generateEmailVerificationEmail(verificationUrl);
    
    try {
      await sendEmail(c.env, {
        to: merchant.email,
        subject,
        html,
        text,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request if email fails
    }

    return c.json({ 
      message: 'Verification email has been sent.' 
    });
  } catch (error) {
    throw error;
  }
});

// Verify email with token
const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

app.post('/email-verification/verify', async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ error: 'Configuration Error', message: 'Database binding not configured' }, 500);
    }

    const body = await c.req.json();
    const { token } = verifyEmailSchema.parse(body);

    const merchant = await getMerchantByEmailVerificationToken(c.env.DB, token);
    if (!merchant) {
      return c.json({ error: 'Invalid', message: 'Invalid verification token' }, 400);
    }

    await verifyEmail(c.env.DB, merchant.id);

    return c.json({ message: 'Email has been verified successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// Enable 2FA (generates TOTP secret)
app.post('/2fa/enable', authMiddleware, async (c) => {
  try {
    if (!c.env.DB || !c.env.CACHE) {
      return c.json({ error: 'Configuration Error', message: 'Database or cache binding not configured' }, 500);
    }

    const merchantId = c.get('merchantId');
    const merchant = await getMerchantById(c.env.DB, merchantId);

    if (!merchant) {
      return c.json({ error: 'Not Found', message: 'Merchant not found' }, 404);
    }

    // Generate TOTP secret
    const totp = new TOTP({
      issuer: 'MicroPaywall',
      label: merchant.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    const secret = totp.secret.base32;
    const backupCodes = Array.from({ length: 10 }, () => generate2FACode());

    // Store backup codes in KV (expire in 90 days)
    const backupCodesKey = `2fa_backup_${merchantId}`;
    await c.env.CACHE.put(backupCodesKey, JSON.stringify(backupCodes), { expirationTtl: 7776000 });

    await setTwoFactorSecret(c.env.DB, merchantId, secret, false);

    // Generate QR code URL
    const otpauthUrl = totp.toString();

    return c.json({
      secret,
      otpauthUrl,
      backupCodes, // Show only once - user should save these
      message: 'Save these backup codes in a safe place. You will need them if you lose access to your 2FA device.',
    });
  } catch (error) {
    throw error;
  }
});

// Verify and enable 2FA (using backup code or secret)
const verify2FASchema = z.object({
  code: z.string().min(6).max(6),
});

app.post('/2fa/verify', authMiddleware, async (c) => {
  try {
    if (!c.env.DB || !c.env.CACHE) {
      return c.json({ error: 'Configuration Error', message: 'Database or cache binding not configured' }, 500);
    }

    const body = await c.req.json();
    const { code } = verify2FASchema.parse(body);

    const merchantId = c.get('merchantId');
    const merchant = await getMerchantById(c.env.DB, merchantId);

    if (!merchant || !merchant.twoFactorSecret) {
      return c.json({ error: 'Bad Request', message: '2FA not set up' }, 400);
    }

    // Check if it's a backup code
    const backupCodesKey = `2fa_backup_${merchantId}`;
    const backupCodesData = await c.env.CACHE.get(backupCodesKey);
    
    if (backupCodesData) {
      const backupCodes = JSON.parse(backupCodesData) as string[];
      const codeIndex = backupCodes.indexOf(code);
      
      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        if (backupCodes.length > 0) {
          await c.env.CACHE.put(backupCodesKey, JSON.stringify(backupCodes), { expirationTtl: 7776000 });
        } else {
          await c.env.CACHE.delete(backupCodesKey);
        }
        
        // Enable 2FA
        await setTwoFactorSecret(c.env.DB, merchantId, merchant.twoFactorSecret, true);
        return c.json({ message: '2FA has been enabled successfully using backup code' });
      }
    }

    // Verify TOTP code
    try {
      const totp = new TOTP({
        secret: merchant.twoFactorSecret,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      });

      const delta = totp.validate({ token: code, window: 2 });
      
      if (delta !== null) {
        // Valid code - enable 2FA
        await setTwoFactorSecret(c.env.DB, merchantId, merchant.twoFactorSecret, true);
        return c.json({ message: '2FA has been enabled successfully' });
      }
    } catch (totpError) {
      console.error('TOTP validation error:', totpError);
    }

    return c.json({ error: 'Invalid', message: 'Invalid 2FA code' }, 400);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// Disable 2FA
app.post('/2fa/disable', authMiddleware, async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ error: 'Configuration Error', message: 'Database binding not configured' }, 500);
    }

    const merchantId = c.get('merchantId');
    await setTwoFactorSecret(c.env.DB, merchantId, '', false);

    return c.json({ message: '2FA has been disabled successfully' });
  } catch (error) {
    throw error;
  }
});

export default app;
