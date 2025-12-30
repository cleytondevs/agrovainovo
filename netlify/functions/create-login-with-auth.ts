import { createClient } from "@supabase/supabase-js";

exports.handler = async (event: any) => {
  console.log("[CREATE-LOGIN-WITH-AUTH] Function started");
  
  // Apenas aceita POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Verificar variáveis de ambiente PRIMEIRO
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    console.log("[CREATE-LOGIN-WITH-AUTH] Environment check:", {
      hasUrl: supabaseUrl.length > 0,
      hasKey: serviceRoleKey.length > 0,
    });

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "Environment variables not configured",
          missing: {
            SUPABASE_URL: !supabaseUrl,
            SUPABASE_SERVICE_ROLE_KEY: !serviceRoleKey
          }
        }),
      };
    }

    let body = event.body;
    
    // Parse body se for string
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    
    const { email, password, clientName, plan, expiresAt } = body;

    // Validar campos obrigatórios
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and password required" }),
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log("[CREATE-LOGIN-WITH-AUTH] Creating user for:", normalizedEmail);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Criar usuário em Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error("[CREATE-LOGIN-WITH-AUTH] Failed to create auth user:", authError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to create Supabase user: ${authError.message}` }),
      };
    }

    console.log("[CREATE-LOGIN-WITH-AUTH] Auth user created:", authUser?.id);

    // Inserir no banco de dados
    const { error: insertError } = await supabaseAdmin.from("logins").insert({
      username: normalizedEmail,
      password,
      client_name: clientName || null,
      email: normalizedEmail,
      plan: plan || "1_month",
      expires_at: expiresAt,
      status: "active",
    });

    if (insertError) {
      console.error("[CREATE-LOGIN-WITH-AUTH] Failed to insert login record:", insertError);
      
      // Tentar deletar o usuário se não conseguir inserir o login
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser!.id);
      } catch (deleteError) {
        console.error("[CREATE-LOGIN-WITH-AUTH] Failed to cleanup auth user:", deleteError);
      }
      
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to create login record: ${insertError.message}` }),
      };
    }

    console.log("[CREATE-LOGIN-WITH-AUTH] Login record created successfully");

    // Retorno de sucesso
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        success: true,
        message: "Login criado com sucesso e usuário adicionado ao Supabase Authentication",
      }),
    };
  } catch (error: any) {
    console.error("[CREATE-LOGIN-WITH-AUTH] Exception:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Failed to create login with auth" }),
    };
  }
};
