-- Add password_hash column to merchants table
ALTER TABLE merchants ADD COLUMN password_hash TEXT;

-- Create index for faster lookups (though email already has an index)
-- Note: We'll keep email-based login but require password verification
