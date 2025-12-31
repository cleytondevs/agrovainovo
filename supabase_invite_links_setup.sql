-- Create invite_links table
CREATE TABLE IF NOT EXISTS invite_links (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invite_links_code ON invite_links(code);
CREATE INDEX IF NOT EXISTS idx_invite_links_email ON invite_links(email);

-- Update users table to add new profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
