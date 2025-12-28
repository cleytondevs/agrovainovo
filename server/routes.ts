import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { getDb, createAccessLink, checkAccessLink, decrementAccessLink } from "./db-client";
import { insertSoilAnalysisSchema } from "@shared/schema";

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
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || ''
    });
  });

  // Create new access link
  app.post('/api/access-links', async (req, res) => {
    try {
      const { linkCode, email } = req.body;
      await createAccessLink(linkCode, email);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to create access link" });
    }
  });

  // Check access link
  app.get('/api/access-links/:code', async (req, res) => {
    try {
      const link = await checkAccessLink(req.params.code);
      if (!link) {
        return res.status(404).json({ error: "Link not found" });
      }
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to check access link" });
    }
  });

  // Use (decrement) access link
  app.post('/api/access-links/:code/use', async (req, res) => {
    try {
      await decrementAccessLink(req.params.code);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to use access link" });
    }
  });

  // Soil analysis endpoint
  app.post('/api/soil-analysis', async (req, res) => {
    try {
      const validationResult = insertSoilAnalysisSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.errors });
      }

      // Store in database if available, otherwise in memory
      const analysisData = validationResult.data;
      await storage.createSoilAnalysis(analysisData);
      
      res.json({ 
        success: true, 
        message: "Análise de solo enviada com sucesso para revisão" 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to submit soil analysis" });
    }
  });

  return httpServer;
}
