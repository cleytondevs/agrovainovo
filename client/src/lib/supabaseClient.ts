import { createClient } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient> | null = null;

async function initializeSupabase() {
  if (supabaseClient) return supabaseClient;

  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Try to fetch from backend if env vars not available
  if (!supabaseAnonKey || !supabaseUrl) {
    try {
      const response = await fetch('/api/config');
      const config = await response.json();
      supabaseUrl = config.supabaseUrl || supabaseUrl;
      supabaseAnonKey = config.supabaseAnonKey || supabaseAnonKey;
    } catch (e) {
      console.warn("Could not fetch Supabase config from backend");
    }
  }

  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    throw new Error("Supabase URL and Key are required");
  }

  return supabaseClient;
}

export async function getSupabaseClient() {
  return initializeSupabase();
}

// For immediate access, try to initialize with env vars
export let supabase: ReturnType<typeof createClient>;
try {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (url && key) {
    supabase = createClient(url, key);
  } else {
    // Initialize async when credentials are available
    initializeSupabase().then(client => {
      supabase = client;
    }).catch(err => {
      console.error("Failed to initialize Supabase:", err);
    });
  }
} catch (e) {
  console.error("Error initializing Supabase client:", e);
}
