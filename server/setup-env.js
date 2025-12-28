#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the SUPABASE_ANON_KEY from environment (set by Replit secrets)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uocgvjfxfpxzecxplffa.supabase.co';

// Create .env.local if it doesn't exist or update it
const envLocalPath = path.join(process.cwd(), '.env.local');
const envContent = `VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey || ''}
`;

try {
  fs.writeFileSync(envLocalPath, envContent, 'utf8');
  console.log('✓ Environment setup complete');
  if (supabaseAnonKey) {
    console.log('✓ SUPABASE_ANON_KEY loaded from secrets');
  } else {
    console.warn('⚠ SUPABASE_ANON_KEY not found in environment');
  }
} catch (error) {
  console.error('Failed to setup environment:', error.message);
  process.exit(1);
}
