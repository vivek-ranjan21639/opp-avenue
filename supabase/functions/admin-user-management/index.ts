// Super-admin only edge function for managing admin users.
// Actions:
//   - lookup_user: { email } -> { user_id, email, display_name }
//   - add_admin:   { email, role: 'admin' | 'editor', modules?: string[] }
//   - set_role:    { user_id, role: 'admin' | 'editor' | 'viewer' }
//   - remove_user: { user_id }   (removes role + permissions, does NOT delete auth user)
//
// All actions require the caller to be a super admin (user_roles.role = 'admin').

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const VALID_MODULES = new Set([
  "analytics",
  "jobs",
  "bulk_jobs",
  "blogs",
  "resources",
  "featured_carousel",
  "taxonomy",
  "user_management",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Missing auth" }, 401);

    // Identify caller
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid token" }, 401);

    const callerId = userData.user.id;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify caller is super admin
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const isSuper = (callerRoles ?? []).some((r) => r.role === "admin");
    if (!isSuper) return json({ error: "Super admin required" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "lookup_user") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!email) return json({ error: "email required" }, 400);
      // listUsers paginates; search via filter not supported on all versions, so iterate small pages
      const found = await findUserByEmail(admin, email);
      if (!found) return json({ error: "User not found" }, 404);
      return json({ user: found });
    }

    if (action === "add_admin") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const role = String(body.role ?? "editor");
      const password = typeof body.password === "string" ? body.password : "";
      const displayName = typeof body.display_name === "string" ? body.display_name.trim() : "";
      const modules: string[] = Array.isArray(body.modules) ? body.modules : [];
      if (!email) return json({ error: "email required" }, 400);
      if (!["admin", "editor"].includes(role)) return json({ error: "Invalid role" }, 400);

      // Editors cannot have analytics or user_management
      const filteredModules =
        role === "editor"
          ? modules.filter((m) => m !== "analytics" && m !== "user_management")
          : modules;

      let found = await findUserByEmail(admin, email);

      // If user doesn't exist and a password was provided, create them
      if (!found) {
        if (!password || password.length < 8) {
          return json(
            { error: "User not found. Provide a password (min 8 chars) to create the account." },
            400,
          );
        }
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: displayName ? { full_name: displayName } : undefined,
        });
        if (createErr || !created?.user) {
          return json({ error: createErr?.message ?? "Failed to create user" }, 400);
        }
        found = {
          user_id: created.user.id,
          email: created.user.email ?? email,
          display_name: displayName || created.user.email || null,
        };
      } else if (password && password.length >= 8) {
        // User exists and caller chose to (re)set their password
        await admin.auth.admin.updateUserById(found.user_id, { password });
      }

      // Insert role (ignore unique conflict)
      const { error: roleErr } = await admin
        .from("user_roles")
        .upsert({ user_id: found.user_id, role }, { onConflict: "user_id,role" });
      if (roleErr) return json({ error: roleErr.message }, 400);

      // For editor, optionally seed module permissions
      if (role === "editor" && filteredModules.length > 0) {
        const valid = filteredModules.filter((m) => VALID_MODULES.has(m));
        if (valid.length > 0) {
          const rows = valid.map((m) => ({
            user_id: found.user_id,
            module: m,
            granted_by: callerId,
          }));
          await admin
            .from("admin_permissions")
            .upsert(rows, { onConflict: "user_id,module" });
        }
      }

      return json({ ok: true, user: found });
    }

    if (action === "set_role") {
      const user_id = String(body.user_id ?? "");
      const role = String(body.role ?? "");
      if (!user_id) return json({ error: "user_id required" }, 400);
      if (!["admin", "editor", "viewer"].includes(role)) {
        return json({ error: "Invalid role" }, 400);
      }
      // Replace roles for that user with the requested one
      await admin.from("user_roles").delete().eq("user_id", user_id);
      const { error: insErr } = await admin
        .from("user_roles")
        .insert({ user_id, role });
      if (insErr) return json({ error: insErr.message }, 400);

      // If demoted from admin, keep their permissions; if promoted to admin, permissions become moot.
      return json({ ok: true });
    }

    if (action === "remove_user") {
      const user_id = String(body.user_id ?? "");
      if (!user_id) return json({ error: "user_id required" }, 400);
      if (user_id === callerId) return json({ error: "Cannot remove yourself" }, 400);
      await admin.from("admin_permissions").delete().eq("user_id", user_id);
      await admin.from("user_roles").delete().eq("user_id", user_id);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("admin-user-management error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function findUserByEmail(admin: ReturnType<typeof createClient>, email: string) {
  // Iterate up to ~5000 users via pagination; fine for admin use.
  let page = 1;
  const perPage = 1000;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (match) {
      return {
        user_id: match.id,
        email: match.email,
        display_name:
          (match.user_metadata as Record<string, unknown> | null)?.full_name ??
          match.email ??
          null,
      };
    }
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}
