import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We use Supabase for Auth, but we might want a local users table for profile data if we were using Postgres.
// Since we are using Supabase, this schema is mostly for type safety or if we decide to sync.
// For now, we'll keep a basic structure.

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username"),
  hasAccessed: boolean("has_accessed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Access links table - tracks setup links with usage limits
export const accessLinks = pgTable("access_links", {
  id: serial("id").primaryKey(),
  linkCode: text("link_code").notNull().unique(),
  usesRemaining: integer("uses_remaining").notNull().default(1),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccessLinkSchema = createInsertSchema(accessLinks).omit({ 
  id: true, 
  createdAt: true 
});

export type AccessLink = typeof accessLinks.$inferSelect;
export type InsertAccessLink = z.infer<typeof insertAccessLinkSchema>;
