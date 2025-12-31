import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// We allow starting without DATABASE_URL for Supabase-only apps to prevent crash loops
// if the user hasn't set up the local DB yet.
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.warn("DATABASE_URL not found, using dummy connection. Storage will fallback to memory if queries fail.");
}

export const pool = new Pool({ 
  connectionString: dbUrl || "postgres://dummy:dummy@localhost:5432/dummy",
  ssl: dbUrl ? { rejectUnauthorized: false } : false
});

// We verify connection lazily or just handle errors in storage
// For now, we export db, but it might throw on query if invalid.
export const db = drizzle(pool, { schema });
