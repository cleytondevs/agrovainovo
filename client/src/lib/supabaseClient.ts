import { createClient } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient> | null = null;

async function initializeSupabase() {
  if (supabaseClient) return supabaseClient;

  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Always try to fetch from backend for most up-to-date credentials
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    if (config.supabaseUrl) supabaseUrl = config.supabaseUrl;
    if (config.supabaseAnonKey) supabaseAnonKey = config.supabaseAnonKey;
  } catch (e) {
    console.warn("Could not fetch Supabase config from backend");
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

// Initialize Supabase asynchronously
export let supabase: ReturnType<typeof createClient>;
initializeSupabase().then(client => {
  supabase = client;
  console.log("Supabase initialized successfully");
}).catch(err => {
  console.error("Failed to initialize Supabase:", err?.message || JSON.stringify(err));
});
