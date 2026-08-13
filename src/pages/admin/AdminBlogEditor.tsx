import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, ArrowLeft, Plus } from "lucide-react";
import BlogEditor from "@/components/admin/BlogEditor";
import {
  useAdminBlog, useSaveBlog, useAdminBlogCategories, useAdminBlogTags, useAdminBlogAuthors,
  useCreateBlogCategory, useCreateBlogTag, useCreateBlogAuthor, useFileUpload,
} from "@/hooks/useAdminData";
import { useAutoSaveDraft } from "@/hooks/useAutoSaveDraft";

export default function AdminBlogEditor() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { data: existingBlog, isLoading } = useAdminBlog(blogId);
  const saveBlog = useSaveBlog();
  const { data: categories = [] } = useAdminBlogCategories();
  const { data: allTags = [] } = useAdminBlogTags();
  const { data: allAuthors = [] } = useAdminBlogAuthors();
  const createCategory = useCreateBlogCategory();
  const createTag = useCreateBlogTag();
  const createAuthor = useCreateBlogAuthor();
  const uploadFile = useFileUpload();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("draft");
  const [slug, setSlug] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [seo, setSeo] = useState<any>({});
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTop, setIsTop] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [wasSaved, setWasSaved] = useState(false);

  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newAuthorOpen, setNewAuthorOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");

  useEffect(() => {
    if (existingBlog && !initialized) {
      setTitle(existingBlog.title || "");
      setSummary(existingBlog.summary || "");
      setContent(existingBlog.content || "");
      setCategoryId(existingBlog.category_id || "");
      setStatus(existingBlog.status || "draft");
      setSlug(existingBlog.slug || "");
      setSelectedTags((existingBlog.b_blog_tags_map || []).map((m: any) => m.tag_id));
      setSelectedAuthors((existingBlog.b_blog_authors_map || []).map((m: any) => m.author_id));
      setThumbnailUrl(existingBlog.thumbnail_url || "");
      setIsFeatured(!!existingBlog.is_featured);
      setIsTop(!!existingBlog.is_top);
      const seoData = Array.isArray(existingBlog.b_blog_seo) ? existingBlog.b_blog_seo[0] : existingBlog.b_blog_seo;
      if (seoData) setSeo(seoData);
      setInitialized(true);
    }
  }, [existingBlog, initialized]);

  // SEO autofill (editable; user edits stick)
  const [seoTouched, setSeoTouched] = useState<Record<string, boolean>>({});
  const markSeoTouched = (k: string) => setSeoTouched((t) => ({ ...t, [k]: true }));
  const stripHtml = (h: string) => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  useEffect(() => {
    const baseTitle = (title || "").slice(0, 60);
    const baseDesc = ((summary || stripHtml(content)) || "").slice(0, 160);
    setSeo((s: any) => {
      const next = { ...s };
      if (!seoTouched.meta_title && baseTitle) next.meta_title = baseTitle;
      if (!seoTouched.meta_description && baseDesc) next.meta_description = baseDesc;
      if (!seoTouched.og_title && baseTitle) next.og_title = baseTitle;
      if (!seoTouched.og_image_url && thumbnailUrl) next.og_image_url = thumbnailUrl;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, summary, content, thumbnailUrl]);

  const isReady = blogId ? initialized : true;

  const formDataForDraft = useMemo(() => ({
    title, summary, content, categoryId, status, slug,
    selectedTags, selectedAuthors, seo, thumbnailUrl, isFeatured, isTop,
  }), [title, summary, content, categoryId, status, slug, selectedTags, selectedAuthors, seo, thumbnailUrl, isFeatured, isTop]);

  const onRestore = useCallback((data: Record<string, any>) => {
    if (data.title !== undefined) setTitle(data.title);
    if (data.summary !== undefined) setSummary(data.summary);
    if (data.content !== undefined) setContent(data.content);
    if (data.categoryId !== undefined) setCategoryId(data.categoryId);
    if (data.status !== undefined) setStatus(data.status);
    if (data.slug !== undefined) setSlug(data.slug);
    if (data.selectedTags) setSelectedTags(data.selectedTags);
    if (data.selectedAuthors) setSelectedAuthors(data.selectedAuthors);
    if (data.seo) setSeo(data.seo);
    if (data.thumbnailUrl !== undefined) setThumbnailUrl(data.thumbnailUrl);
    if (data.isFeatured !== undefined) setIsFeatured(!!data.isFeatured);
    if (data.isTop !== undefined) setIsTop(!!data.isTop);
  }, []);

  const onAutoSave = useCallback(async () => {
    if (!title) return false;
    try {
      const blog: any = {
        title, summary, content, status: "draft", slug: slug || undefined,
        category_id: categoryId || null, thumbnail_url: thumbnailUrl || null,
        is_featured: isFeatured, is_top: isTop,
      };
      if (blogId) blog.id = blogId;
      await saveBlog.mutateAsync({
        blog, authors: selectedAuthors, tags: selectedTags,
        seo: seo.meta_title ? seo : undefined,
      });
      return true;
    } catch { return false; }
  }, [title, summary, content, slug, categoryId, thumbnailUrl, isFeatured, isTop, blogId, selectedAuthors, selectedTags, seo, saveBlog]);

  const hasContent = useCallback(() => !!title.trim(), [title]);

  const { clearDraft, lastSavedAt } = useAutoSaveDraft({
    storageKey: `blog-${blogId || "new"}`,
    formData: formDataForDraft,
    onRestore,
    onAutoSave,
    isNew: !blogId,
    isSaved: wasSaved,
    hasContent,
    isReady,
  });

  const handleSave = async () => {
    const blog: any = {
      title, summary, content, status, slug: slug || undefined,
      category_id: categoryId || null, thumbnail_url: thumbnailUrl || null,
      is_featured: isFeatured, is_top: isTop,
    };
    if (blogId) blog.id = blogId;
    if (status === "published" && !existingBlog?.published_at) blog.published_at = new Date().toISOString();

    await saveBlog.mutateAsync({
      blog, authors: selectedAuthors, tags: selectedTags,
      seo: seo.meta_title ? seo : undefined,
    });
    setWasSaved(true);
    clearDraft();
    navigate("/admin/blogs");
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const result = await createCategory.mutateAsync(newCatName.trim());
    setCategoryId(result.id);
    setNewCatName("");
    setNewCatOpen(false);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const result = await createTag.mutateAsync(newTagName.trim());
    setSelectedTags((p) => [...p, result.id]);
    setNewTagName("");
    setNewTagOpen(false);
  };

  const handleCreateAuthor = async () => {
    if (!newAuthorName.trim()) return;
    const result = await createAuthor.mutateAsync(newAuthorName.trim());
    setSelectedAuthors((p) => [...p, result.id]);
    setNewAuthorName("");
    setNewAuthorOpen(false);
  };

  if (blogId && isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">{blogId ? "Edit Blog" : "New Blog"}</h1>
        {lastSavedAt && (
          <span className="text-xs text-muted-foreground ml-auto">
            Auto-saved at {lastSavedAt.toLocaleTimeString()}
          </span>
        )}
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="taxonomy">Tags & Authors</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <div className="flex gap-2">
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" onClick={() => setNewCatOpen(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Placement</Label>
                <div className="flex flex-wrap items-center gap-4 mt-2 rounded-md border border-input bg-background px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    {!isFeatured && !isTop ? "-- Select -- (none)" : "Selected:"}
                  </span>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={isFeatured}
                      onCheckedChange={(v) => setIsFeatured(v === true)}
                    />
                    Featured (shown on Blogs page)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={isTop}
                      onCheckedChange={(v) => setIsTop(v === true)}
                    />
                    Top Blog (shown on Job Detail page)
                  </label>
                </div>
              </div>
              <div><Label>Summary</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} /></div>
              <div>
                <Label>Thumbnail</Label>
                <div className="flex items-center gap-4 mt-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const id = blogId || 'new-' + Date.now();
                      const ext = file.name.split('.').pop() || 'webp';
                      const path = `blogs/${id}/featured/featured_${id}.${ext}`;
                      const url = await uploadFile.mutateAsync({ file, path, bucket: 'content' });
                      setThumbnailUrl(url);
                    }}
                  />
                  {thumbnailUrl && (
                    <img src={thumbnailUrl} alt="Thumbnail" className="h-16 w-16 object-cover rounded border border-input-border" />
                  )}
                </div>
              </div>
              <div><Label>Content</Label><BlogEditor content={content} onChange={setContent} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxonomy">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Tags</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setNewTagOpen(true)} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> New Tag
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedTags.map(id => {
                    const tag = allTags.find((t: any) => t.id === id);
                    return tag ? <Badge key={id} variant="secondary" className="gap-1">{tag.name}<X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedTags(p => p.filter(t => t !== id))} /></Badge> : null;
                  })}
                </div>
                <Select onValueChange={(v) => { if (!selectedTags.includes(v)) setSelectedTags(p => [...p, v]); }}>
                  <SelectTrigger><SelectValue placeholder="Add tag..." /></SelectTrigger>
                  <SelectContent>{allTags.filter((t: any) => !selectedTags.includes(t.id)).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Authors</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setNewAuthorOpen(true)} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> New Author
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedAuthors.map(id => {
                    const author = allAuthors.find((a: any) => a.id === id);
                    return author ? <Badge key={id} variant="secondary" className="gap-1">{author.name}<X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedAuthors(p => p.filter(a => a !== id))} /></Badge> : null;
                  })}
                </div>
                <Select onValueChange={(v) => { if (!selectedAuthors.includes(v)) setSelectedAuthors(p => [...p, v]); }}>
                  <SelectTrigger><SelectValue placeholder="Add author..." /></SelectTrigger>
                  <SelectContent>{allAuthors.filter((a: any) => !selectedAuthors.includes(a.id)).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div><Label>Meta Title</Label><Input value={seo.meta_title || ""} onChange={(e) => { markSeoTouched('meta_title'); setSeo((s: any) => ({ ...s, meta_title: e.target.value })); }} /></div>
              <div><Label>Meta Description</Label><Textarea value={seo.meta_description || ""} onChange={(e) => { markSeoTouched('meta_description'); setSeo((s: any) => ({ ...s, meta_description: e.target.value })); }} /></div>
              <div><Label>OG Title</Label><Input value={seo.og_title || ""} onChange={(e) => { markSeoTouched('og_title'); setSeo((s: any) => ({ ...s, og_title: e.target.value })); }} /></div>
              <div><Label>OG Image URL</Label><Input value={seo.og_image_url || ""} onChange={(e) => { markSeoTouched('og_image_url'); setSeo((s: any) => ({ ...s, og_image_url: e.target.value })); }} /></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        <Button onClick={handleSave} disabled={saveBlog.isPending}>
          <Save className="h-4 w-4 mr-2" /> {saveBlog.isPending ? "Saving..." : "Save Blog"}
        </Button>
      </div>

      <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Category</DialogTitle></DialogHeader>
          <div><Label>Name</Label><Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Category name" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCatOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCategory} disabled={!newCatName.trim() || createCategory.isPending}>
              {createCategory.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newTagOpen} onOpenChange={setNewTagOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Tag</DialogTitle></DialogHeader>
          <div><Label>Name</Label><Input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Tag name" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTagOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTag} disabled={!newTagName.trim() || createTag.isPending}>
              {createTag.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newAuthorOpen} onOpenChange={setNewAuthorOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Author</DialogTitle></DialogHeader>
          <div><Label>Name</Label><Input value={newAuthorName} onChange={(e) => setNewAuthorName(e.target.value)} placeholder="Author name" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewAuthorOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAuthor} disabled={!newAuthorName.trim() || createAuthor.isPending}>
              {createAuthor.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
