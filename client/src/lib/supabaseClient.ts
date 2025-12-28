import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Try both VITE_SUPABASE_ANON_KEY (for backward compatibility) and SUPABASE_ANON_KEY (from Replit secrets)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn in development, though this might break the app if not set
  console.warn("Supabase URL or Key is missing. Authentication will not work.");
  console.warn("VITE_SUPABASE_URL:", supabaseUrl);
  console.warn("VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);
  console.warn("SUPABASE_ANON_KEY:", import.meta.env.SUPABASE_ANON_KEY);
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder"
);
