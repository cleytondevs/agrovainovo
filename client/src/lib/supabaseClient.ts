import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn in development, though this might break the app if not set
  console.warn("Supabase URL or Key is missing. Authentication will not work.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder"
);
