import type { Express } from "express";
import type { Server } from "http";
import crypto from "crypto";
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

      // Update directly in Supabase with anon key (clients can update their own analyses)
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ error: "Supabase not configured" });
      }

      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);

      const filesArray = adminFileUrls ? adminFileUrls.split(";").filter(f => f.trim()) : [];
      
      const { data, error } = await supabaseClient
        .from('soil_analysis')
        .update({
          status: status,
          admin_comments: adminComments || "",
          admin_file_urls: filesArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('[PATCH /api/soil-analysis/:id/review] Error:', error);
        return res.status(400).json({ error: error.message || "Failed to update analysis" });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      res.json(data[0]);
    } catch (error: any) {
      console.error('[PATCH /api/soil-analysis/:id/review] Exception:', error.message);
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
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
      });

      if (authError) {
        console.error('[CREATE-LOGIN-WITH-AUTH] Failed to create auth user:', authError);
        throw new Error(`Failed to create Supabase user: ${authError.message}`);
      }

      const authUser = authData.user;
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
        if (authUser) {
          await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        }
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

  // Validate invite link
  app.get('/api/validate-invite', async (req, res) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== "string") {
        return res.status(400).json({ valid: false, error: "Code is required" });
      }

      // Try memory storage first
      let invite = await storage.getInviteByCode(code);

      // If not in memory, try Supabase
      if (!invite) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data, error } = await supabase
            .from('invite_links')
            .select('*')
            .eq('code', code)
            .maybeSingle();

          if (data && !error) {
            invite = {
              id: data.id,
              code: data.code,
              email: data.email,
              usedAt: data.used_at ? new Date(data.used_at) : null,
              expiresAt: data.expires_at ? new Date(data.expires_at) : null,
              createdAt: new Date(data.created_at)
            };
          }
        }
      }

      if (!invite) {
        return res.status(200).json({ valid: false, error: "Invite not found" });
      }

      // Check if already used
      if (invite.usedAt) {
        return res.status(200).json({ valid: false, error: "Invite already used" });
      }

      // Check if expired
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
        return res.status(200).json({ valid: false, error: "Invite expired" });
      }

      return res.status(200).json({ valid: true, email: invite.email });
    } catch (error) {
      console.error("Error validating invite:", error);
      res.status(500).json({ valid: false, error: "Internal server error" });
    }
  });

  // Save user profile after signup
  app.post('/api/save-user-profile', async (req, res) => {
    try {
      const { email, fullName, phone, address, occupation, education, birthDate, inviteCode } = req.body;

      // Validate required fields
      if (!email || !fullName || !phone || !address || !occupation || !education || !birthDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Save user to database
      const user = await storage.createUser({
        email,
        fullName,
        phone,
        address,
        occupation,
        education,
        birthDate,
      });

      // Mark invite as used
      if (inviteCode) {
        await storage.markInviteAsUsed(inviteCode);
      }

      res.status(201).json({ success: true, user });
    } catch (error) {
      console.error("Error saving user profile:", error);
      res.status(500).json({ error: "Failed to save user profile" });
    }
  });

  // Create new invite link (admin endpoint)
  app.post('/api/create-invite', async (req, res) => {
    try {
      const { email, expiresIn } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Generate unique code
      const code = crypto.randomBytes(16).toString("hex");

      // Set expiration (default 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (expiresIn || 7));

      // Try to save to Supabase first, fallback to memory storage
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

      let invite = null;

      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data, error } = await supabase
            .from('invite_links')
            .insert({
              code,
              email: email.trim().toLowerCase(),
              expires_at: expiresAt.toISOString()
            })
            .select();

          if (error) {
            console.warn('Failed to save invite to Supabase:', error);
            // Fallback to memory storage
            invite = await storage.createInviteLink({ code, email, expiresAt });
          } else {
            invite = data?.[0];
          }
        } catch (supabaseError) {
          console.warn('Supabase error, falling back to memory:', supabaseError);
          invite = await storage.createInviteLink({ code, email, expiresAt });
        }
      } else {
        invite = await storage.createInviteLink({ code, email, expiresAt });
      }

      const inviteUrl = `${process.env.VITE_APP_URL || req.get('origin') || 'http://localhost:5000'}/signup?code=${code}`;

      res.status(201).json({ 
        success: true, 
        invite,
        inviteUrl,
      });
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(500).json({ error: "Failed to create invite" });
    }
  });

  // Get all invites (admin endpoint)
  app.get('/api/invites', async (req, res) => {
    try {
      const invites = await storage.getAllInvites();
      res.status(200).json(invites);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ error: "Failed to fetch invites" });
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

  // Get all authenticated users (from Supabase Auth)
  app.get('/api/auth-users', async (req, res) => {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

      if (!supabaseUrl || !serviceRoleKey) {
        console.error('[AUTH-USERS] Missing Supabase configuration');
        return res.status(500).json({ error: "Supabase not configured" });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      
      // Fetch all users from Supabase Auth
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        console.error('[AUTH-USERS] Failed to fetch auth users:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      // Format users data
      const formattedUsers = (users?.users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
      }));

      res.json(formattedUsers);
    } catch (error: any) {
      console.error('[AUTH-USERS] Exception:', error.message);
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });

  return httpServer;
}
