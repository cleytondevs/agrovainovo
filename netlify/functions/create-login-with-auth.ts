import { createClient } from "@supabase/supabase-js";

export default async (req: any, context: any) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { email, password, clientName, plan, expiresAt } = JSON.parse(req.body || "{}");

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[CREATE-LOGIN-WITH-AUTH] Missing Supabase configuration");
      return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 500 });
    }

    console.log("[CREATE-LOGIN-WITH-AUTH] Creating user for email:", normalizedEmail);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      console.error("[CREATE-LOGIN-WITH-AUTH] Failed to create auth user:", authError);
      return new Response(
        JSON.stringify({ error: `Failed to create Supabase user: ${authError.message}` }),
        { status: 500 }
      );
    }

    console.log("[CREATE-LOGIN-WITH-AUTH] Auth user created:", authUser?.id);

    // Now insert into logins table
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
      // Try to delete the auth user if we can't insert the login
      await supabaseAdmin.auth.admin.deleteUser(authUser!.id);
      return new Response(
        JSON.stringify({ error: `Failed to create login record: ${insertError.message}` }),
        { status: 500 }
      );
    }

    console.log("[CREATE-LOGIN-WITH-AUTH] Login record created successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Login criado com sucesso e usuário adicionado ao Supabase Authentication",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[CREATE-LOGIN-WITH-AUTH] Exception:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to create login with auth" }), {
      status: 500,
    });
  }
};
