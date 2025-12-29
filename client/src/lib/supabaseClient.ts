import { createClient } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient> | null = null;

async function initializeSupabase() {
  if (supabaseClient) return supabaseClient;

  // No Netlify, as variáveis de ambiente VITE_ são injetadas durante o build.
  // Se elas não estiverem presentes no código compilado, usamos estes valores como fallback.
  const DEFAULT_URL = "https://uocgvjfxfpxzecxplffa.supabase.co";
  const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvY2d2amZ4ZnB4emVjeHBsZmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTA4NzksImV4cCI6MjA4MjQ2Njg3OX0.1a3DK1gXo0XW2bA8sh5iaJEQqUZXx1FF3ZlwqZ-8afs";

  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
  let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    // Attempt to fetch from backend if environment variables are missing
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        if (config.supabaseUrl && config.supabaseAnonKey) {
          supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
        }
      }
    } catch (e) {
      // Silently fail as we might be in a static environment
    }
  }

  if (!supabaseClient) {
    // If we're still without a client, we check if we're on localhost to provide a better error
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      throw new Error("Supabase URL and Key are required. Check your .env file.");
    } else {
      throw new Error("Erro de Configuração: As chaves do Supabase não foram encontradas no Netlify.");
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
