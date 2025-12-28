import { createClient } from "@supabase/supabase-js";

// Get environment variables from Vite first, fallback to defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uocgvjfxfpxzecxplffa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use a placeholder key initially to avoid errors, will be replaced if config fetched
let currentKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';
let supabaseClient = createClient(supabaseUrl, currentKey);

// Fetch actual config from backend if key is missing
if (!supabaseAnonKey) {
  (async () => {
    try {
      const response = await fetch('/api/config');
      const config = await response.json();
      if (config.supabaseAnonKey && config.supabaseAnonKey !== '') {
        // Recreate client with actual key
        supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
      }
    } catch (e) {
      console.warn("Could not fetch Supabase config from backend");
    }
  })();
}

export const supabase = supabaseClient;
