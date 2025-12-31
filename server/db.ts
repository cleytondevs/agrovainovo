import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// We allow starting without DATABASE_URL for Supabase-only apps to prevent crash loops
// if the user hasn't set up the local DB yet.
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_URL;

if (!dbUrl) {
  console.warn("DATABASE_URL, SUPABASE_DB_URL, or SUPABASE_URL not found. Using dummy connection.");
}

// Ensure we have a valid PostgreSQL connection string
let connectionString = dbUrl || "postgres://dummy:dummy@localhost:5432/dummy";

// If using SUPABASE_URL (the API URL), we need to handle it or ensure it's a real PG URL.
// Supabase PG URL usually looks like postgres://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
if (dbUrl?.includes('supabase.co') && !dbUrl?.startsWith('postgres')) {
  const projectRef = dbUrl.split('//')[1].split('.')[0];
  const password = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_KEY || ''; 
  connectionString = `postgres://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
}

export const pool = new Pool({ 
  connectionString,
  ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : false
});

// We verify connection lazily or just handle errors in storage
// For now, we export db, but it might throw on query if invalid.
export const db = drizzle(pool, { schema });
