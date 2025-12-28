import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We use Supabase for Auth, but we might want a local users table for profile data if we were using Postgres.
// Since we are using Supabase, this schema is mostly for type safety or if we decide to sync.
// For now, we'll keep a basic structure.

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
