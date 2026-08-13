import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ContentType = "poster_static" | "poster_clickable" | "poster_job_link" | "job_card";
type DisplayLocation = "home" | "job_detail";

interface FeaturedRow {
  id: string;
  content_type: ContentType;
  title: string | null;
  image_url: string | null;
  link_url: string | null;
  job_id: string | null;
  display_location: DisplayLocation;
  display_order: number;
  is_active: boolean;
  job?: { id: string; title: string; slug: string } | null;
}

const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  poster_static: "Static poster",
  poster_clickable: "Poster + external link",
  poster_job_link: "Poster + job link",
  job_card: "Job card",
};

export default function AdminFeatured() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [locationTab, setLocationTab] = useState<DisplayLocation>("home");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<FeaturedRow> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobSearch, setJobSearch] = useState("");

  // Fetch featured items for the active tab
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-featured", locationTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("j_featured")
        .select(`
          id, content_type, title, image_url, link_url, job_id,
          display_location, display_order, is_active,
          job:j_jobs!j_featured_job_id_fkey(id, title, slug)
        `)
        .eq("display_location", locationTab)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as FeaturedRow[];
    },
  });

  // Fetch published jobs for the job picker
  const { data: jobs = [] } = useQuery({
    queryKey: ["admin-featured-jobs-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("j_jobs")
        .select("id, title, slug, j_companies(name)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const filteredJobs = useMemo(() => {
    if (!jobSearch.trim()) return jobs;
    const q = jobSearch.toLowerCase();
    return jobs.filter((j: any) =>
      j.title?.toLowerCase().includes(q) ||
      j.j_companies?.name?.toLowerCase().includes(q)
    );
  }, [jobs, jobSearch]);

  const upsert = useMutation({
    mutationFn: async (payload: Partial<FeaturedRow>) => {
      const row: any = {
        content_type: payload.content_type,
        title: payload.title || null,
        image_url: payload.image_url || null,
        link_url: payload.link_url || null,
        job_id: payload.job_id || null,
        display_location: payload.display_location,
        display_order: payload.display_order ?? 0,
        is_active: payload.is_active ?? true,
      };
      if (payload.id) {
        const { error } = await supabase.from("j_featured").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("j_featured").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-featured"] });
      qc.invalidateQueries({ queryKey: ["featured-content"] });
      toast({ title: "Saved" });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("j_featured").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-featured"] });
      qc.invalidateQueries({ queryKey: ["featured-content"] });
      toast({ title: "Deleted" });
    },
  });

  const reorder = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase.from("j_featured").update({ display_order: newOrder }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-featured"] }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("j_featured").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-featured"] });
      qc.invalidateQueries({ queryKey: ["featured-content"] });
    },
  });

  const handleMove = (idx: number, dir: -1 | 1) => {
    const a = items[idx];
    const b = items[idx + dir];
    if (!a || !b) return;
    reorder.mutate({ id: a.id, newOrder: b.display_order });
    reorder.mutate({ id: b.id, newOrder: a.display_order });
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `featured/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("content").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("content").getPublicUrl(path);
      setEditing((prev) => ({ ...(prev || {}), image_url: data.publicUrl }));
      toast({ title: "Image uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const openNew = () => {
    setEditing({
      content_type: "poster_static",
      title: "",
      image_url: "",
      link_url: "",
      job_id: null,
      display_location: locationTab,
      display_order: items.length,
      is_active: true,
    });
    setOpen(true);
  };

  const openEdit = (row: FeaturedRow) => {
    setEditing({ ...row });
    setOpen(true);
  };

  const handleSave = () => {
    if (!editing) return;
    if (editing.content_type === "job_card" || editing.content_type === "poster_job_link") {
      if (!editing.job_id) {
        toast({ title: "Pick a job", variant: "destructive" });
        return;
      }
    }
    if (editing.content_type === "poster_clickable" && !editing.link_url) {
      toast({ title: "External link required", variant: "destructive" });
      return;
    }
    if (editing.content_type !== "job_card" && !editing.image_url) {
      toast({ title: "Image required for poster items", variant: "destructive" });
      return;
    }
    upsert.mutate(editing);
  };

  const ct = editing?.content_type as ContentType | undefined;
  const needsImage = ct && ct !== "job_card";
  const needsExternalLink = ct === "poster_clickable";
  const needsJobPicker = ct === "poster_job_link" || ct === "job_card";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Featured Carousel</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Featured Item</Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={locationTab === "home" ? "default" : "outline"}
          onClick={() => setLocationTab("home")}
          size="sm"
        >Home page</Button>
        <Button
          variant={locationTab === "job_detail" ? "default" : "outline"}
          onClick={() => setLocationTab("job_detail")}
          size="sm"
        >Job detail page</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No featured items for this location yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Order</TableHead>
                <TableHead className="w-[80px]">Preview</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title / Job</TableHead>
                <TableHead className="w-[100px]">Active</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => handleMove(idx, -1)}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === items.length - 1} onClick={() => handleMove(idx, 1)}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.image_url ? (
                      <img src={row.image_url} alt="" className="h-12 w-16 object-cover rounded" />
                    ) : row.content_type === "job_card" ? (
                      <div className="h-12 w-16 rounded bg-primary/20 flex items-center justify-center text-xs">Job</div>
                    ) : (
                      <div className="h-12 w-16 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{CONTENT_TYPE_LABEL[row.content_type]}</Badge></TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {row.title || row.job?.title || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.is_active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: row.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete featured item?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate(row.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit" : "Add"} Featured Item</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Content type</Label>
                <Select
                  value={editing.content_type}
                  onValueChange={(v) => setEditing({ ...editing, content_type: v as ContentType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poster_static">Static poster (no link)</SelectItem>
                    <SelectItem value="poster_clickable">Poster with external link</SelectItem>
                    <SelectItem value="poster_job_link">Poster linking to a job</SelectItem>
                    <SelectItem value="job_card">Job card (auto-generated from job)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Display location</Label>
                <Select
                  value={editing.display_location}
                  onValueChange={(v) => setEditing({ ...editing, display_location: v as DisplayLocation })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home page</SelectItem>
                    <SelectItem value="job_detail">Job detail page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title (optional, shown on the card)</Label>
                <Input
                  value={editing.title || ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="e.g. Summer hiring drive"
                />
              </div>

              {needsImage && (
                <div>
                  <Label>Poster image</Label>
                  <div className="flex items-center gap-3">
                    {editing.image_url && (
                      <img src={editing.image_url} alt="" className="h-20 w-28 object-cover rounded border" />
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      />
                      <Button type="button" variant="outline" disabled={uploading} asChild>
                        <span><Upload className="h-4 w-4 mr-2" />{uploading ? "Uploading..." : "Upload image"}</span>
                      </Button>
                    </label>
                  </div>
                  <Input
                    className="mt-2"
                    placeholder="Or paste image URL"
                    value={editing.image_url || ""}
                    onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recommended ratio: 4:3 (e.g. 800×600).</p>
                </div>
              )}

              {needsExternalLink && (
                <div>
                  <Label>External link URL</Label>
                  <Input
                    value={editing.link_url || ""}
                    onChange={(e) => setEditing({ ...editing, link_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {needsJobPicker && (
                <div>
                  <Label>Pick a job</Label>
                  <Input
                    placeholder="Search jobs by title or company..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="mb-2"
                  />
                  <div className="border rounded max-h-60 overflow-y-auto">
                    {filteredJobs.slice(0, 50).map((j: any) => (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => setEditing({ ...editing, job_id: j.id })}
                        className={`w-full text-left p-2 text-sm hover:bg-muted border-b last:border-0 ${
                          editing.job_id === j.id ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="font-medium">{j.title}</div>
                        <div className="text-xs text-muted-foreground">{j.j_companies?.name || "—"}</div>
                      </button>
                    ))}
                    {filteredJobs.length === 0 && (
                      <p className="p-3 text-sm text-muted-foreground">No jobs found.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Display order</Label>
                  <Input
                    type="number"
                    value={editing.display_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })}
                    className="w-32"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.is_active ?? true}
                    onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
