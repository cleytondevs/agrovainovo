-- Add plan and expiration date columns to logins table
ALTER TABLE logins ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT '1_month';
ALTER TABLE logins ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Create index for faster expiration queries
CREATE INDEX IF NOT EXISTS idx_logins_expires_at ON logins(expires_at);
