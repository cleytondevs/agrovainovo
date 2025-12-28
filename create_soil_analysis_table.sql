-- Create soil_analysis table in Supabase
CREATE TABLE IF NOT EXISTS soil_analysis (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  field_name TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  pH NUMERIC(4, 2),
  nitrogen NUMERIC(6, 2),
  phosphorus NUMERIC(6, 2),
  potassium NUMERIC(6, 2),
  moisture NUMERIC(5, 2),
  organic_matter NUMERIC(5, 2),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by user email
CREATE INDEX IF NOT EXISTS idx_soil_analysis_user_email ON soil_analysis(user_email);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_soil_analysis_status ON soil_analysis(status);

-- Enable Row Level Security (RLS) for security
ALTER TABLE soil_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to see only their own analyses
CREATE POLICY "Users can view their own analyses" ON soil_analysis
  FOR SELECT USING (user_email = current_setting('app.current_user_email', true));

CREATE POLICY "Users can insert their own analyses" ON soil_analysis
  FOR INSERT WITH CHECK (user_email = current_setting('app.current_user_email', true));

CREATE POLICY "Users can update their own analyses" ON soil_analysis
  FOR UPDATE USING (user_email = current_setting('app.current_user_email', true));
