import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.health.check.path, (req, res) => {
    res.json({ status: 'ok' });
  });

  // Serve config with Supabase credentials
  app.get('/api/config', (req, res) => {
    res.json({
      supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://uocgvjfxfpxzecxplffa.supabase.co',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
    });
  });

  return httpServer;
}
