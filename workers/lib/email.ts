/**
 * Email service utility
 * Supports multiple email providers (Resend, SendGrid, SMTP, etc.)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using configured provider
 * Falls back to console.log in development
 */
export async function sendEmail(env: any, options: EmailOptions): Promise<void> {
  const { to, subject, html, text } = options;
  
  // Use Resend if API key is configured
  if (env.RESEND_API_KEY) {
    return sendViaResend(env.RESEND_API_KEY, { to, subject, html, text });
  }
  
  // Use SendGrid if API key is configured
  if (env.SENDGRID_API_KEY) {
    return sendViaSendGrid(env.SENDGRID_API_KEY, { to, subject, html, text });
  }
  
  // Fallback: Log to console (for development)
  console.log('📧 Email (not sent - no email service configured):');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${html}`);
  
  // In production, you should configure at least one email service
  if (env.NODE_ENV === 'production' && !env.RESEND_API_KEY && !env.SENDGRID_API_KEY) {
    console.warn('⚠️ WARNING: No email service configured in production!');
  }
}

/**
 * Send email via Resend
 */
async function sendViaResend(apiKey: string, options: EmailOptions): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MicroPaywall <noreply@micropaywall.app>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(apiKey: string, options: EmailOptions): Promise<void> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: options.to }],
      }],
      from: { email: 'noreply@micropaywall.app', name: 'MicroPaywall' },
      subject: options.subject,
      content: [
        {
          type: 'text/html',
          value: options.html,
        },
        ...(options.text ? [{
          type: 'text/plain',
          value: options.text,
        }] : []),
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error}`);
  }
}

/**
 * Generate email templates
 */
export function generatePasswordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  const subject = 'Reset Your Password - MicroPaywall';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">MicroPaywall</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #111827; margin-top: 0;">Reset Your Password</h2>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #6b7280; font-size: 14px; word-break: break-all;">${resetUrl}</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;
  const text = `
MicroPaywall - Reset Your Password

You requested to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request this, please ignore this email.
  `.trim();
  
  return { subject, html, text };
}

export function generateEmailVerificationEmail(verificationUrl: string): { subject: string; html: string; text: string } {
  const subject = 'Verify Your Email - MicroPaywall';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">MicroPaywall</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #111827; margin-top: 0;">Verify Your Email</h2>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verify Email</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #6b7280; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you didn't create an account, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;
  const text = `
MicroPaywall - Verify Your Email

Thank you for signing up! Please verify your email address by clicking the link below:

${verificationUrl}

If you didn't create an account, please ignore this email.
  `.trim();
  
  return { subject, html, text };
}
