-- Add email verification and password reset tokens
ALTER TABLE merchants ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE merchants ADD COLUMN email_verification_token TEXT;
ALTER TABLE merchants ADD COLUMN password_reset_token TEXT;
ALTER TABLE merchants ADD COLUMN password_reset_expires_at INTEGER;
ALTER TABLE merchants ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE merchants ADD COLUMN locked_until INTEGER;
ALTER TABLE merchants ADD COLUMN two_factor_secret TEXT;
ALTER TABLE merchants ADD COLUMN two_factor_enabled INTEGER NOT NULL DEFAULT 0;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_merchants_email_verification_token ON merchants(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_merchants_password_reset_token ON merchants(password_reset_token);
