import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { createAccessLink, checkAccessLink, decrementAccessLink, getLoginById } from "./db-client";
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
    // Try multiple environment variable names for cross-platform compatibility
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';
    
    console.log('[API/CONFIG] Supabase config requested:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl.substring(0, 30)
    });
    
    res.json({
      supabaseUrl,
      supabaseAnonKey
    });
  });

  // Debug endpoint to show all Supabase-related env vars (only in non-production)
  app.get('/api/debug/supabase-config', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json({
      'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL ? '✓ SET' : '✗ MISSING',
      'SUPABASE_URL': process.env.SUPABASE_URL ? '✓ SET' : '✗ MISSING',
      'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY ? '✓ SET' : '✗ MISSING',
      'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY ? '✓ SET' : '✗ MISSING',
      'SUPABASE_KEY': process.env.SUPABASE_KEY ? '✓ SET' : '✗ MISSING',
      'NODE_ENV': process.env.NODE_ENV,
      'resolved_url': process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL.substring(0, 40) : 'MISSING',
      'resolved_key_exists': !!process.env.SUPABASE_ANON_KEY || !!process.env.VITE_SUPABASE_ANON_KEY
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

  // Delete soil analysis
  app.delete('/api/soil-analysis/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSoilAnalysis(id);
      res.json({ success: true, message: "Análise deletada com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete analysis" });
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

  // Create new login with Supabase Auth user
  app.post('/api/logins/create-with-auth', async (req, res) => {
    try {
      const { email, password, clientName, plan, expiresAt } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

      if (!supabaseUrl || !serviceRoleKey) {
        console.error('[CREATE-LOGIN-WITH-AUTH] Missing Supabase configuration');
        return res.status(500).json({ error: "Supabase not configured" });
      }

      console.log('[CREATE-LOGIN-WITH-AUTH] Creating user for email:', normalizedEmail);

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
      });

      if (authError) {
        console.error('[CREATE-LOGIN-WITH-AUTH] Failed to create auth user:', authError);
        throw new Error(`Failed to create Supabase user: ${authError.message}`);
      }

      console.log('[CREATE-LOGIN-WITH-AUTH] Auth user created:', authUser?.id);

      // Now insert into logins table
      const { error: insertError } = await supabaseAdmin.from('logins').insert({
        username: normalizedEmail,
        password,
        client_name: clientName || null,
        email: normalizedEmail,
        plan: plan || '1_month',
        expires_at: expiresAt,
        status: "active"
      });

      if (insertError) {
        console.error('[CREATE-LOGIN-WITH-AUTH] Failed to insert login record:', insertError);
        // Try to delete the auth user if we can't insert the login
        await supabaseAdmin.auth.admin.deleteUser(authUser!.id);
        throw new Error(`Failed to create login record: ${insertError.message}`);
      }

      console.log('[CREATE-LOGIN-WITH-AUTH] Login record created successfully');

      res.json({ 
        success: true,
        message: "Login criado com sucesso e usuário adicionado ao Supabase Authentication"
      });
    } catch (error: any) {
      console.error('[CREATE-LOGIN-WITH-AUTH] Exception:', error);
      res.status(500).json({ error: error.message || "Failed to create login with auth" });
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
      
      // Get the login to retrieve email before deletion
      const login = await getLoginById(id);
      if (!login || !login.email) {
        return res.status(404).json({ error: "Login not found" });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

      // Delete from Supabase Auth if credentials are available
      if (supabaseUrl && serviceRoleKey) {
        try {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
          const normalizedEmail = login.email.trim().toLowerCase();
          
          // List users to find the one with this email
          const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          
          if (!listError && users) {
            const user = users.users.find(u => u.email?.toLowerCase() === normalizedEmail);
            if (user) {
              // Delete the user from Supabase Auth
              await supabaseAdmin.auth.admin.deleteUser(user.id);
              console.log('[DELETE-LOGIN] Deleted user from Supabase Auth:', normalizedEmail);
            }
          }
        } catch (authError: any) {
          console.error('[DELETE-LOGIN] Failed to delete from Supabase Auth:', authError);
          // Continue with deletion even if Supabase Auth deletion fails
        }
      }

      // Delete from logins table
      await storage.deleteLogin(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete login" });
    }
  });

  // Check if login still exists (for session validation)
  app.post('/api/verify-login-exists', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Supabase not configured" });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const normalizedEmail = email.trim().toLowerCase();
      
      const { data: logins, error } = await supabase
        .from('logins')
        .select('*')
        .ilike('email', normalizedEmail)
        .eq('status', 'active');

      if (error || !logins || logins.length === 0) {
        return res.status(401).json({ error: "Login not found" });
      }

      // Check if login has expired
      const login = logins[0];
      if (login.expires_at && new Date(login.expires_at) < new Date()) {
        return res.status(401).json({ error: "Login has expired" });
      }

      // Also verify user still exists in Supabase Auth
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (serviceRoleKey) {
        try {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
          const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
          
          if (!userError && users) {
            const userExists = users.users.some(u => u.email?.toLowerCase() === normalizedEmail);
            if (!userExists) {
              return res.status(401).json({ error: "User deleted" });
            }
          }
        } catch (e) {
          // Continue if we can't verify in Auth - it's optional
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('[VERIFY-LOGIN-EXISTS] Exception:', error);
      res.status(500).json({ error: error.message || "Verification failed" });
    }
  });

  // Verify login credentials against logins table
  app.post('/api/verify-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Use environment variables available at runtime
      // VITE_* variables are only available during build, not at runtime
      // So we need to use the non-VITE versions that are set in Netlify environment
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
      
      console.log('[VERIFY-LOGIN] Attempting login:', {
        email,
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlPreview: supabaseUrl?.substring(0, 35)
      });

      if (!supabaseUrl || !supabaseKey) {
        console.error('[VERIFY-LOGIN] Missing Supabase configuration:', {
          VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
          SUPABASE_URL: !!process.env.SUPABASE_URL,
          SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
          VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY
        });
        return res.status(500).json({ error: "Supabase not configured" });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Trim email and normalize it for comparison
      const normalizedEmail = email.trim().toLowerCase();
      
      const { data: logins, error } = await supabase
        .from('logins')
        .select('*')
        .ilike('email', normalizedEmail)
        .eq('status', 'active');

      console.log('[VERIFY-LOGIN] Query result:', {
        email: normalizedEmail,
        found: logins?.length || 0,
        error: error?.message
      });

      if (error) {
        console.error('[VERIFY-LOGIN] Supabase query error:', error);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!logins || logins.length === 0) {
        console.log('[VERIFY-LOGIN] No logins found for email:', normalizedEmail);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password against all matching emails
      const matchingLogin = logins.find(l => l.password === password);
      
      if (!matchingLogin) {
        console.log('[VERIFY-LOGIN] Password mismatch for email:', normalizedEmail);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if login has expired
      if (matchingLogin.expires_at && new Date(matchingLogin.expires_at) < new Date()) {
        console.log('[VERIFY-LOGIN] Login expired for:', normalizedEmail);
        return res.status(401).json({ error: "Login has expired" });
      }

      // Verify user still exists in Supabase Auth
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (serviceRoleKey) {
        try {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
          const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
          
          if (!userError && users) {
            const userExists = users.users.some(u => u.email?.toLowerCase() === normalizedEmail);
            if (!userExists) {
              console.log('[VERIFY-LOGIN] User deleted from Supabase Auth:', normalizedEmail);
              return res.status(401).json({ error: "Invalid credentials" });
            }
          }
        } catch (e) {
          console.warn('[VERIFY-LOGIN] Could not validate user existence:', e);
          // Continue if we can't verify - better UX than blocking all logins
        }
      }

      console.log('[VERIFY-LOGIN] Successful login for:', normalizedEmail);
      res.json({ 
        success: true, 
        user: {
          id: matchingLogin.id,
          email: matchingLogin.email,
          username: matchingLogin.username,
          clientName: matchingLogin.client_name,
          plan: matchingLogin.plan
        }
      });
    } catch (error: any) {
      console.error('[VERIFY-LOGIN] Exception:', error);
      res.status(500).json({ error: error.message || "Verification failed" });
    }
  });

  return httpServer;
}
