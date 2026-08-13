import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSaveResource, useAdminResourceCategories, useCreateResourceCategory, useFileUpload } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Save, Plus, X, FileText } from "lucide-react";
import { useAutoSaveDraft } from "@/hooks/useAutoSaveDraft";
import { useResourceTagGroups, DEFAULT_FIELD_CONFIG, type ResourceFieldConfig } from "@/hooks/useResources";
import ResourceEditor from "@/components/admin/ResourceEditor";

const STATUSES = ["draft", "published"] as const;

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminResourceEditor() {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const saveResource = useSaveResource();
  const { data: categories = [] } = useAdminResourceCategories();
  
  const createCategory = useCreateResourceCategory();
  const uploadFile = useFileUpload();

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    notes: "",
    content: "",
    resource_type: "guide" as string,
    status: "draft" as string,
    category_id: "" as string,
    display_order: 0,
    video_url: "",
    thumbnail_url: "",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [seo, setSeo] = useState({ meta_title: "", meta_description: "" });
  const [loading, setLoading] = useState(!!resourceId);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<{ id?: string; file_url: string; file_type: string; mime_type: string; is_downloadable: boolean }[]>([]);
  const [wasSaved, setWasSaved] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(!resourceId);

  // Active category — drives field_config + tag groups
  const activeCategory = categories.find((c: any) => c.id === form.category_id) as any;
  const fieldConfig: ResourceFieldConfig = { ...DEFAULT_FIELD_CONFIG, ...((activeCategory?.field_config) || {}) };
  const { data: tagGroups = [] } = useResourceTagGroups(form.category_id || null);

  useEffect(() => {
    if (!resourceId) return;
    (async () => {
      const { data } = await supabase
        .from("r_resources")
        .select("*, r_resource_tags_map(tag_id), r_resource_seo(*), r_resource_files(*)")
        .eq("id", resourceId)
        .single();
      if (data) {
        setForm({
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          notes: (data as any).notes || "",
          content: (data as any).content || "",
          resource_type: data.resource_type || "guide",
          status: data.status || "draft",
          category_id: data.category_id || "",
          display_order: data.display_order || 0,
          video_url: (data as any).video_url || "",
          thumbnail_url: (data as any).thumbnail_url || "",
        });
        setSelectedTags((data.r_resource_tags_map || []).map((t: any) => t.tag_id));
        if (data.r_resource_seo) {
          setSeo({
            meta_title: data.r_resource_seo.meta_title || "",
            meta_description: data.r_resource_seo.meta_description || "",
          });
        }
        if (data.r_resource_files) {
          setAttachedFiles(data.r_resource_files.map((f: any) => ({
            id: f.id,
            file_url: f.file_url || "",
            file_type: f.file_type || "",
            mime_type: f.mime_type || "",
            is_downloadable: f.is_downloadable ?? true,
          })));
        }
      }
      setLoading(false);
      setDbLoaded(true);
    })();
  }, [resourceId]);

  // SEO autofill
  const [seoTouched, setSeoTouched] = useState<Record<string, boolean>>({});
  const markSeoTouched = (k: string) => setSeoTouched((t) => ({ ...t, [k]: true }));
  useEffect(() => {
    const baseTitle = (form.title || "").slice(0, 60);
    const baseDesc = (form.description || "").slice(0, 160);
    setSeo((s) => ({
      meta_title: seoTouched.meta_title ? s.meta_title : (baseTitle || s.meta_title),
      meta_description: seoTouched.meta_description ? s.meta_description : (baseDesc || s.meta_description),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, form.description]);

  const formDataForDraft = useMemo(() => ({
    form, selectedTags, seo, attachedFiles,
  }), [form, selectedTags, seo, attachedFiles]);

  const onRestore = useCallback((data: Record<string, any>) => {
    if (data.form) setForm(data.form);
    if (data.selectedTags) setSelectedTags(data.selectedTags);
    if (data.seo) setSeo(data.seo);
    if (data.attachedFiles) setAttachedFiles(data.attachedFiles);
  }, []);

  const onAutoSave = useCallback(async () => {
    if (!form.title) return false;
    try {
      const resource: any = { ...form, status: "draft" };
      if (resourceId) resource.id = resourceId;
      if (!resource.category_id) delete resource.category_id;
      await saveResource.mutateAsync({
        resource, tags: selectedTags,
        seo: seo.meta_title || seo.meta_description ? seo : undefined,
      });
      return true;
    } catch { return false; }
  }, [form, resourceId, selectedTags, seo, saveResource]);

  const hasContent = useCallback(() => !!form.title.trim(), [form.title]);

  const { clearDraft, lastSavedAt } = useAutoSaveDraft({
    storageKey: `resource-${resourceId || "new"}`,
    formData: formDataForDraft,
    onRestore,
    onAutoSave,
    isNew: !resourceId,
    isSaved: wasSaved,
    hasContent,
    isReady: dbLoaded,
  });

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: resourceId ? f.slug : slugify(title) }));
  };

  const handleSave = async () => {
    const resource: any = { ...form };
    if (resourceId) resource.id = resourceId;
    if (!resource.category_id) delete resource.category_id;
    saveResource.mutate(
      { resource, tags: selectedTags, seo: seo.meta_title || seo.meta_description ? seo : undefined },
      {
        onSuccess: async (saved: any) => {
          const savedId = saved?.id || resourceId;
          if (savedId && attachedFiles.length > 0) {
            await supabase.from("r_resource_files").delete().eq("resource_id", savedId);
            const fileRows = attachedFiles.map((f) => ({
              resource_id: savedId,
              file_url: f.file_url,
              file_type: f.file_type,
              mime_type: f.mime_type,
              is_downloadable: f.is_downloadable,
              storage_type: 'uploaded' as const,
            }));
            await supabase.from("r_resource_files").insert(fileRows);
          }
          setWasSaved(true);
          clearDraft();
          navigate("/admin/resources");
        },
      }
    );
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = resourceId || "new-" + Date.now();
    const ext = file.name.split(".").pop() || "bin";
    const label = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    const path = `resources/${id}/files/file_${id}_${label}.${ext}`;
    const url = await uploadFile.mutateAsync({ file, path, bucket: "content" });
    setAttachedFiles((prev) => [
      ...prev,
      { file_url: url, file_type: ext.toUpperCase(), mime_type: file.type, is_downloadable: true },
    ]);
    e.target.value = "";
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const result = await createCategory.mutateAsync(newCategoryName.trim());
    setForm((f) => ({ ...f, category_id: result.id }));
    setNewCategoryName("");
    setNewCategoryOpen(false);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]));
  };

  // Only tags that belong to a tag group of the currently-selected category are shown.
  // Legacy / ungrouped tags are intentionally hidden so the editor matches what's
  // configured in Resource Categories → Tag groups.

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/resources")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{resourceId ? "Edit Resource" : "New Resource"}</h1>
        {lastSavedAt && (
          <span className="text-xs text-muted-foreground ml-auto">
            Auto-saved at {lastSavedAt.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Status + category are always shown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <div className="flex gap-2">
              <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => setNewCategoryOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {!form.category_id && (
          <div className="rounded-md border border-input bg-muted/30 p-3 text-sm text-muted-foreground">
            Pick a category above to load its configured fields.
          </div>
        )}

        {/* Title — always required for slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fieldConfig.title !== false && (
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Resource title" />
            </div>
          )}
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          </div>
        </div>

        {fieldConfig.description && (
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
        )}

        {fieldConfig.notes && (
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Internal notes or extra info shown on the card" />
          </div>
        )}

        {fieldConfig.tags && form.category_id && (
          <div className="space-y-3">
            <Label>Tags</Label>
            {tagGroups.length === 0 && (
              <p className="text-xs text-muted-foreground">No tag groups configured for this category yet. Add them from Resource Tags.</p>
            )}
            {tagGroups.map((g: any) => (
              <div key={g.id}>
                <p className="text-xs font-semibold text-muted-foreground mb-1">{g.name}</p>
                <div className="flex flex-wrap gap-2">
                  {g.tags.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">No tags in this group.</span>
                  ) : g.tags.map((t: any) => (
                    <Badge
                      key={t.id}
                      variant={selectedTags.includes(t.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(t.id)}
                    >
                      {t.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {fieldConfig.file && (
          <div>
            <Label>File Attachments</Label>
            <div className="mt-2 space-y-2">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border border-input-border rounded bg-input">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">{file.file_url.split('/').pop()}</span>
                  <Badge variant="outline" className="text-xs">{file.file_type}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <Input
                type="file"
                onChange={handleFileAttach}
                disabled={uploadFile.isPending}
              />
              {uploadFile.isPending && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
            </div>
          </div>
        )}

        {fieldConfig.content && (
          <div>
            <Label>Content</Label>
            <p className="text-xs text-muted-foreground mb-2">Rich content shown on the resource's own page when a visitor opens it.</p>
            <ResourceEditor content={form.content} onChange={(html) => setForm((f) => ({ ...f, content: html }))} />
          </div>
        )}

        {(fieldConfig.link || fieldConfig.thumbnail) && (
          <div className="border border-input-border rounded-lg p-4 space-y-3 bg-muted/30">
            {fieldConfig.link && (
              <div>
                <Label>Link URL <span className="text-xs text-muted-foreground font-normal">(optional — clicking the card opens this URL)</span></Label>
                <Input
                  value={form.video_url}
                  onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            )}
            {fieldConfig.thumbnail && (
              <div>
                <Label>Thumbnail <span className="text-xs text-muted-foreground font-normal">(URL or upload — auto-derived from YouTube if blank)</span></Label>
                <div className="flex gap-2">
                  <Input
                    value={form.thumbnail_url}
                    onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    className="flex-1"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const id = resourceId || "new-" + Date.now();
                      const ext = file.name.split(".").pop() || "jpg";
                      const path = `resources/${id}/thumbnails/thumb_${id}.${ext}`;
                      const url = await uploadFile.mutateAsync({ file, path, bucket: "content" });
                      setForm((f) => ({ ...f, thumbnail_url: url }));
                      e.target.value = "";
                    }}
                    disabled={uploadFile.isPending}
                  />
                </div>
                {form.thumbnail_url && (
                  <img src={form.thumbnail_url} alt="thumbnail preview" className="mt-2 h-24 rounded border border-input-border object-cover" />
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>SEO Title</Label>
            <Input value={seo.meta_title} onChange={(e) => { markSeoTouched('meta_title'); setSeo((s) => ({ ...s, meta_title: e.target.value })); }} />
          </div>
          <div>
            <Label>SEO Description</Label>
            <Input value={seo.meta_description} onChange={(e) => { markSeoTouched('meta_description'); setSeo((s) => ({ ...s, meta_description: e.target.value })); }} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={!form.title || !form.slug || saveResource.isPending}>
          <Save className="h-4 w-4 mr-2" /> {saveResource.isPending ? "Saving…" : "Save Resource"}
        </Button>
      </div>

      <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Category</DialogTitle></DialogHeader>
          <div><Label>Name</Label><Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category name" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCategoryOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim() || createCategory.isPending}>
              {createCategory.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
