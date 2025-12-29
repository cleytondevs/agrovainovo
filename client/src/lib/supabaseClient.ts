import { createClient } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient> | null = null;

async function initializeSupabase() {
  if (supabaseClient) return supabaseClient;

  // No Netlify, as variáveis de ambiente VITE_ devem ser configuradas nas variáveis de build
  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Fallback: tenta obter as chaves do backend se não estiverem presentes
  if (!supabaseUrl || !supabaseAnonKey) {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        supabaseUrl = config.supabaseUrl || supabaseUrl;
        supabaseAnonKey = config.supabaseAnonKey || supabaseAnonKey;
      }
    } catch (e) {
      console.warn("Failed to fetch Supabase config from backend:", e);
    }
  }

  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      throw new Error("Supabase URL and Key são necessários. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu arquivo .env");
    } else {
      throw new Error("Erro de Configuração: Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Netlify como variáveis de ambiente.");
    }
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
