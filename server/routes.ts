import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { createAccessLink, checkAccessLink, decrementAccessLink } from "./db-client";
import { insertSoilAnalysisSchema, insertLoginSchema } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

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

  // Get all soil analyses (admin only)
  app.get('/api/soil-analysis/all', async (req, res) => {
    try {
      const analyses = await storage.getAllSoilAnalysis();
      res.json(analyses);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch analyses" });
    }
  });

  // Get user soil analyses
  app.get('/api/soil-analysis/user/:email', async (req, res) => {
    try {
      const email = req.params.email;
      const analyses = await storage.getUserSoilAnalysis(email);
      res.json(analyses);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch user analyses" });
    }
  });

  // Update soil analysis status
  app.patch('/api/soil-analysis/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const id = parseInt(req.params.id);
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updated = await storage.updateSoilAnalysisStatus(id, status);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update status" });
    }
  });

  // Update soil analysis with comments and files
  app.patch('/api/soil-analysis/:id/review', async (req, res) => {
    try {
      const { status, adminComments, adminFileUrls } = req.body;
      const id = parseInt(req.params.id);
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updated = await storage.updateSoilAnalysisWithComments(
        id,
        status,
        adminComments || "",
        adminFileUrls || ""
      );
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update analysis" });
    }
  });

  // Get all users (admin only)
  app.get('/api/users/all', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });

  // Create new login
  app.post('/api/logins', async (req, res) => {
    try {
      const validationResult = insertLoginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.errors });
      }
      const login = await storage.createLogin(validationResult.data);
      res.json(login);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create login" });
    }
  });

  // Get all logins
  app.get('/api/logins', async (req, res) => {
    try {
      const logins = await storage.getAllLogins();
      res.json(logins);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch logins" });
    }
  });

  // Delete login
  app.delete('/api/logins/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLogin(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete login" });
    }
  });

  // Verify login credentials against logins table
  app.post('/api/verify-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Supabase not configured" });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: logins, error } = await supabase
        .from('logins')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .eq('status', 'active');

      if (error || !logins || logins.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const login = logins[0];

      // Check if login has expired
      if (login.expires_at && new Date(login.expires_at) < new Date()) {
        return res.status(401).json({ error: "Login has expired" });
      }

      res.json({ 
        success: true, 
        user: {
          id: login.id,
          email: login.email,
          username: login.username,
          clientName: login.client_name,
          plan: login.plan
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Verification failed" });
    }
  });

  return httpServer;
}
