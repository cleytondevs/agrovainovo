import { pgTable, text, serial, boolean, timestamp, integer, decimal } from "drizzle-orm/pg-core";
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

// Soil analysis table
export const soilAnalysis = pgTable("soil_analysis", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  fieldName: text("field_name").notNull(),
  cropType: text("crop_type").notNull(),
  pH: decimal("pH", { precision: 4, scale: 2 }),
  nitrogen: decimal("nitrogen", { precision: 6, scale: 2 }),
  phosphorus: decimal("phosphorus", { precision: 6, scale: 2 }),
  potassium: decimal("potassium", { precision: 6, scale: 2 }),
  moisture: decimal("moisture", { precision: 5, scale: 2 }),
  organicMatter: decimal("organic_matter", { precision: 5, scale: 2 }),
  status: text("status").default("pending"),
  notes: text("notes"),
  adminComments: text("admin_comments"),
  adminFileUrls: text("admin_file_urls"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSoilAnalysisSchema = createInsertSchema(soilAnalysis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  adminComments: true,
  adminFileUrls: true,
});

export type SoilAnalysis = typeof soilAnalysis.$inferSelect;
export type InsertSoilAnalysis = z.infer<typeof insertSoilAnalysisSchema>;

// Login generator table
export const logins = pgTable("logins", {
  id: serial("id").primaryKey(),
  username: text("username"),
  password: text("password").notNull(),
  clientName: text("client_name"),
  email: text("email"),
  plan: text("plan"),
  expiresAt: timestamp("expires_at"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLoginSchema = createInsertSchema(logins).omit({ 
  id: true, 
  createdAt: true 
});

export type Login = typeof logins.$inferSelect;
export type InsertLogin = z.infer<typeof insertLoginSchema>;
