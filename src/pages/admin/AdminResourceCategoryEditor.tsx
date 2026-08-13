import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ResourceTagGroupsManager from "@/components/admin/ResourceTagGroupsManager";
import { DEFAULT_FIELD_CONFIG, type ResourceFieldConfig } from "@/hooks/useResources";

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface Cat {
  id?: string;
  name: string;
  slug: string;
  display_order: number;
  is_filled: boolean;
  default_view: "list" | "grid";
  field_config?: ResourceFieldConfig | null;
}

export default function AdminResourceCategoryEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-resource-category", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("r_categories")
        .select("id, name, slug, display_order, is_filled, default_view, field_config")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Cat;
    },
  });

  const [editing, setEditing] = useState<Cat>({
    name: "",
    slug: "",
    display_order: 0,
    is_filled: false,
    default_view: "list",
    field_config: { ...DEFAULT_FIELD_CONFIG },
  });

  useEffect(() => {
    if (data) {
      setEditing({ ...data, field_config: { ...DEFAULT_FIELD_CONFIG, ...(data.field_config || {}) } });
    }
  }, [data]);

  const upsert = useMutation({
    mutationFn: async (c: Cat) => {
      const payload: any = {
        name: c.name,
        slug: c.slug || slugify(c.name),
        display_order: c.display_order ?? 0,
        is_filled: c.is_filled ?? false,
        default_view: c.default_view ?? "list",
        field_config: c.field_config ?? DEFAULT_FIELD_CONFIG,
      };
      const { data: saved, error } = c.id
        ? await (supabase as any).from("r_categories").update(payload).eq("id", c.id).select().single()
        : await (supabase as any).from("r_categories").insert(payload).select().single();
      if (error) throw error;

      // Clean up per-resource data for fields just disabled on an existing category
      if (c.id && data?.field_config) {
        const oldCfg = { ...DEFAULT_FIELD_CONFIG, ...(data.field_config || {}) };
        const newCfg = { ...DEFAULT_FIELD_CONFIG, ...(c.field_config || {}) };
        const justDisabled = (k: keyof ResourceFieldConfig) => !!oldCfg[k] && !newCfg[k];

        const colNulls: Record<string, null> = {};
        if (justDisabled("content")) colNulls.content = null;
        if (justDisabled("thumbnail")) colNulls.thumbnail_url = null;
        if (justDisabled("description")) colNulls.description = null;
        if (justDisabled("notes")) colNulls.notes = null;
        if (justDisabled("link")) colNulls.video_url = null;

        if (Object.keys(colNulls).length > 0) {
          await (supabase as any).from("r_resources").update(colNulls).eq("category_id", c.id);
        }

        if (justDisabled("tags") || justDisabled("file")) {
          const { data: rs } = await (supabase as any)
            .from("r_resources").select("id").eq("category_id", c.id);
          const ids = (rs || []).map((r: any) => r.id);
          if (ids.length > 0) {
            if (justDisabled("tags")) {
              await (supabase as any).from("r_resource_tags_map").delete().in("resource_id", ids);
            }
            if (justDisabled("file")) {
              await (supabase as any).from("r_resource_files").delete().in("resource_id", ids);
            }
          }
        }
      }
      return saved;
    },
    onSuccess: (saved: any) => {
      qc.invalidateQueries({ queryKey: ["admin-resource-categories-full"] });
      qc.invalidateQueries({ queryKey: ["admin-resource-categories"] });
      qc.invalidateQueries({ queryKey: ["resource-categories"] });
      qc.invalidateQueries({ queryKey: ["published-resources"] });
      qc.invalidateQueries({ queryKey: ["admin-resource-category", saved?.id] });
      toast({ title: "Category saved" });
      if (isNew && saved?.id) {
        navigate(`/admin/resources/categories/${saved.id}`, { replace: true });
      }
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSave = async () => {
    if (!editing.name?.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    // Warn if any field is being disabled — that wipes stored data on existing resources
    if (data?.field_config) {
      const oldCfg = { ...DEFAULT_FIELD_CONFIG, ...(data.field_config || {}) };
      const newCfg = { ...DEFAULT_FIELD_CONFIG, ...(editing.field_config || {}) };
      const disabled = (["content","thumbnail","description","notes","link","tags","file"] as const)
        .filter((k) => !!oldCfg[k] && !newCfg[k]);
      if (disabled.length > 0) {
        const ok = window.confirm(
          `You are disabling: ${disabled.join(", ")}.\n\nAll existing data for these fields will be permanently removed from resources in this category. Continue?`
        );
        if (!ok) return;
      }
    }
    await upsert.mutateAsync({ ...editing, slug: (editing.slug || slugify(editing.name)).trim() });
  };

  if (!isNew && isLoading) {
    return <p className="text-muted-foreground p-6">Loading...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/resources/categories")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{isNew ? "New Category" : "Edit Category"}</h1>
        </div>
        <Button onClick={handleSave} disabled={upsert.isPending}>
          <Save className="h-4 w-4 mr-2" /> Save
        </Button>
      </div>

      <div className="rounded-md border border-input p-4 space-y-4">
        <div>
          <Label>Name</Label>
          <Input
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })}
            placeholder="Category name"
          />
        </div>
        <div>
          <Label>Slug</Label>
          <Input
            value={editing.slug}
            onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
            placeholder="auto-generated-from-name"
          />
        </div>
        <div>
          <Label>Display Order</Label>
          <Input
            type="number"
            value={editing.display_order ?? 0}
            onChange={(e) => setEditing({ ...editing, display_order: parseInt(e.target.value || "0", 10) })}
          />
          <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first on the Resources page.</p>
        </div>
        <div className="flex items-center justify-between rounded-md border border-input p-3">
          <div>
            <Label>Filled with color</Label>
            <p className="text-xs text-muted-foreground mt-1">Render this category card with a solid fill on the Resources page.</p>
          </div>
          <Switch checked={!!editing.is_filled} onCheckedChange={(v) => setEditing({ ...editing, is_filled: v })} />
        </div>
        <div>
          <Label>Resources Layout</Label>
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant={editing.default_view !== "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setEditing({ ...editing, default_view: "list" })}
            >List</Button>
            <Button
              type="button"
              variant={editing.default_view === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setEditing({ ...editing, default_view: "grid" })}
            >Grid (3 per row)</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Controls how resources display on this category page.</p>
        </div>
      </div>

      <div className="rounded-md border border-input p-4 space-y-3">
        <Label className="text-sm font-semibold">Fields shown when adding a resource</Label>
        <p className="text-xs text-muted-foreground">Toggle which inputs admins see for this category. Hidden fields stay empty.</p>
        {(["thumbnail", "title", "description", "notes", "tags", "link", "file", "content"] as const).map((k) => (
          <div key={k} className="flex items-center justify-between">
            <Label className="capitalize text-sm font-normal">{k}</Label>
            <Switch
              checked={editing.field_config?.[k] ?? DEFAULT_FIELD_CONFIG[k] ?? false}
              onCheckedChange={(v) => setEditing({
                ...editing,
                field_config: { ...DEFAULT_FIELD_CONFIG, ...(editing.field_config || {}), [k]: v },
              })}
            />
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <Label className="text-sm font-normal">Cards are hyperlinked</Label>
            <p className="text-xs text-muted-foreground">If off, cards are plain (not clickable).</p>
          </div>
          <Switch
            checked={editing.field_config?.linked ?? true}
            onCheckedChange={(v) => setEditing({
              ...editing,
              field_config: { ...DEFAULT_FIELD_CONFIG, ...(editing.field_config || {}), linked: v },
            })}
          />
        </div>
      </div>

      {!isNew && editing.id && (
        <div className="rounded-md border border-input p-4 space-y-3">
          <Label className="text-sm font-semibold">Tag Groups & Tags</Label>
          <p className="text-xs text-muted-foreground">Filter groups shown on this category's page.</p>
          <ResourceTagGroupsManager categoryId={editing.id} />
        </div>
      )}
    </div>
  );
}
