import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TaxonomyKind = "job_type" | "work_mode" | "experience_level";

export interface TaxonomyOption {
  id: string;
  kind: TaxonomyKind;
  value: string;
  label: string;
  display_order: number;
}

export const useJobTaxonomy = (kind?: TaxonomyKind) => {
  return useQuery({
    queryKey: ["j_taxonomy", kind ?? "all"],
    queryFn: async () => {
      let q = (supabase as any).from("j_taxonomy").select("id, kind, value, label, display_order").order("display_order", { ascending: true });
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as TaxonomyOption[];
    },
  });
};

// Build a label lookup: value -> label per kind
export const useTaxonomyLabelMap = () => {
  const { data = [] } = useJobTaxonomy();
  const map: Record<TaxonomyKind, Record<string, string>> = {
    job_type: {}, work_mode: {}, experience_level: {},
  };
  for (const t of data) {
    if (map[t.kind]) map[t.kind][t.value] = t.label;
  }
  return map;
};

export const useUpsertTaxonomy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<TaxonomyOption> & { kind: TaxonomyKind; value: string; label: string }) => {
      const payload: any = {
        kind: row.kind,
        value: row.value.trim().toLowerCase().replace(/\s+/g, "_"),
        label: row.label.trim(),
        display_order: row.display_order ?? 0,
      };
      if (row.id) {
        const { error } = await (supabase as any).from("j_taxonomy").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("j_taxonomy").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["j_taxonomy"] }),
  });
};

export const useDeleteTaxonomy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("j_taxonomy").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["j_taxonomy"] }),
  });
};
