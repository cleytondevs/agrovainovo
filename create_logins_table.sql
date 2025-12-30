-- Create logins table for storing generated login credentials
CREATE TABLE IF NOT EXISTS logins (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  client_name TEXT,
  email TEXT,
  plan TEXT DEFAULT '1_month',
  expires_at TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_logins_status ON logins(status);
CREATE INDEX IF NOT EXISTS idx_logins_created_at ON logins(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE logins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (adjust as needed for security)
CREATE POLICY "Allow all access to logins" ON logins
  FOR ALL
  USING (true)
  WITH CHECK (true);
