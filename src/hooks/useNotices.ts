import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NoticePageKey =
  | "home"
  | "lighthouse"
  | "blog_detail"
  | "resources"
  | "resource_category"
  | "job_detail"
  | "about"
  | "contact"
  | "advertise";

export const NOTICE_PAGE_OPTIONS: { value: NoticePageKey; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "lighthouse", label: "Lighthouse (Blogs)" },
  { value: "blog_detail", label: "Article Detail" },
  { value: "resources", label: "Resources" },
  { value: "resource_category", label: "Resource Category" },
  { value: "job_detail", label: "Job Detail" },
  { value: "about", label: "About" },
  { value: "contact", label: "Contact" },
  { value: "advertise", label: "Advertise" },
];

export interface AdminNotice {
  id: string;
  message: string;
  link_url: string | null;
  is_active: boolean;
  target_pages: string[];
  display_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchActiveNotices = async (page: NoticePageKey) => {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("admin_notices" as any)
    .select("*")
    .eq("is_active", true)
    .contains("target_pages", [page])
    .order("display_order", { ascending: true });
  if (error) throw error;
  // Filter date window client-side (so the same query is cacheable per page)
  return ((data || []) as any as AdminNotice[]).filter((n) => {
    if (n.starts_at && n.starts_at > nowIso) return false;
    if (n.ends_at && n.ends_at < nowIso) return false;
    return true;
  });
};

export const activeNoticesQueryOptions = (page: NoticePageKey) => ({
  queryKey: ["notices-active", page] as const,
  queryFn: () => fetchActiveNotices(page),
  staleTime: 60_000,
});

// Public hook: fetch active notices for a given page key
export const useActiveNotices = (page: NoticePageKey) => {
  return useQuery(activeNoticesQueryOptions(page));
};

// Admin hooks
export const useAdminNotices = () => {
  return useQuery({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notices" as any)
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any as AdminNotice[];
    },
  });
};

export const useUpsertNotice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (n: Partial<AdminNotice> & { message: string }) => {
      const payload: any = {
        message: n.message,
        link_url: n.link_url || null,
        is_active: n.is_active ?? true,
        target_pages: n.target_pages ?? [],
        display_order: n.display_order ?? 0,
        starts_at: n.starts_at || null,
        ends_at: n.ends_at || null,
      };
      const { data, error } = n.id
        ? await supabase.from("admin_notices" as any).update(payload).eq("id", n.id).select().single()
        : await supabase.from("admin_notices" as any).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
      qc.invalidateQueries({ queryKey: ["notices-active"] });
    },
  });
};

export const useDeleteNotice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_notices" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
      qc.invalidateQueries({ queryKey: ["notices-active"] });
    },
  });
};
