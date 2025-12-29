import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get Supabase credentials from environment
// Try multiple variable names to support different platforms (Replit, Netlify, etc.)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

// Create .env.local if it doesn't exist or update it
const envLocalPath = path.join(path.dirname(__dirname), '.env.local');
const envContent = `VITE_SUPABASE_URL=${supabaseUrl || ''}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey || ''}
`;

try {
  fs.writeFileSync(envLocalPath, envContent, 'utf8');
  console.log('✓ Environment setup complete');
  
  if (supabaseUrl) {
    console.log('✓ VITE_SUPABASE_URL loaded');
  } else {
    console.warn('⚠ VITE_SUPABASE_URL not found - Supabase authentication may not work');
  }
  
  if (supabaseAnonKey) {
    console.log('✓ SUPABASE_ANON_KEY loaded');
  } else {
    console.warn('⚠ SUPABASE_ANON_KEY not found - Supabase authentication may not work');
  }
} catch (error) {
  console.error('Failed to setup environment:', error.message);
  process.exit(1);
}
