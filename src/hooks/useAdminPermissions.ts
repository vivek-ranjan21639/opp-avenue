import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "./useAdminAuth";

export type AdminModule =
  | "analytics"
  | "jobs"
  | "bulk_jobs"
  | "blogs"
  | "resources"
  | "featured_carousel"
  | "taxonomy"
  | "user_management";

export const ALL_ADMIN_MODULES: AdminModule[] = [
  "analytics",
  "jobs",
  "bulk_jobs",
  "blogs",
  "resources",
  "featured_carousel",
  "taxonomy",
  "user_management",
];

export const MODULE_LABELS: Record<AdminModule, string> = {
  analytics: "Analytics Dashboard",
  jobs: "Jobs (live/draft/edit)",
  bulk_jobs: "Bulk Job Upload",
  blogs: "Blogs",
  resources: "Resources",
  featured_carousel: "Featured Carousel",
  taxonomy: "Taxonomy (locations, domains, skills, companies, tags, categories, authors)",
  user_management: "User Management (assign permissions)",
};

/**
 * Returns the set of modules the current user can access.
 * Super admins (role='admin') get every module automatically.
 * Editors only get explicitly-granted modules.
 */
export function useAdminPermissions() {
  const { user, isAdmin, loading: authLoading } = useAdminAuth();
  const [modules, setModules] = useState<Set<AdminModule>>(new Set());
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setModules(new Set());
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    // Check super admin via user_roles (already cached server-side)
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const superAdmin = (roleRows ?? []).some((r) => r.role === "admin");
    setIsSuperAdmin(superAdmin);

    if (superAdmin) {
      setModules(new Set(ALL_ADMIN_MODULES));
      setLoading(false);
      return;
    }

    const { data: perms } = await supabase
      .from("admin_permissions")
      .select("module")
      .eq("user_id", user.id);

    setModules(new Set((perms ?? []).map((p) => p.module as AdminModule)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  const has = useCallback(
    (mod: AdminModule) => isSuperAdmin || modules.has(mod),
    [isSuperAdmin, modules]
  );

  return {
    loading: loading || authLoading,
    isSuperAdmin,
    modules,
    has,
    refresh,
    isAdmin,
  };
}
