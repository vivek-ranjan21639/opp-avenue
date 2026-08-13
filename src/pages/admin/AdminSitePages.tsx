import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BlogEditor from "@/components/admin/BlogEditor";
import { toast } from "sonner";

const PAGES: { slug: string; title: string }[] = [
  { slug: 'about', title: 'About Page' },
  { slug: 'advertise', title: 'Advertise Page' },
];

interface PageRow {
  slug: string;
  content: string;
  enabled: boolean;
}

export default function AdminSitePages() {
  const [rows, setRows] = useState<Record<string, PageRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('site_pages')
        .select('slug, content, enabled')
        .in('slug', PAGES.map((p) => p.slug));
      if (error) {
        toast.error('Failed to load pages');
        setLoading(false);
        return;
      }
      const map: Record<string, PageRow> = {};
      for (const p of PAGES) {
        const found = (data || []).find((r) => r.slug === p.slug);
        map[p.slug] = found ?? { slug: p.slug, content: '', enabled: false };
      }
      setRows(map);
      setLoading(false);
    })();
  }, []);

  const update = (slug: string, patch: Partial<PageRow>) => {
    setRows((prev) => ({ ...prev, [slug]: { ...prev[slug], ...patch } }));
  };

  const save = async (slug: string) => {
    const row = rows[slug];
    if (!row) return;
    setSaving(slug);
    const { error } = await supabase
      .from('site_pages')
      .upsert({ slug, content: row.content, enabled: row.enabled }, { onConflict: 'slug' });
    setSaving(null);
    if (error) toast.error(`Save failed: ${error.message}`);
    else toast.success('Page saved');
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Site Pages</h1>
        <p className="text-sm text-muted-foreground">
          Manage rich-text content shown on the About and Advertise pages. Disable to fall back to the default layout.
        </p>
      </div>
      <Tabs defaultValue="about" className="w-full">
        <TabsList>
          {PAGES.map((p) => (
            <TabsTrigger key={p.slug} value={p.slug}>{p.title}</TabsTrigger>
          ))}
        </TabsList>
        {PAGES.map((p) => {
          const row = rows[p.slug];
          if (!row) return null;
          return (
            <TabsContent key={p.slug} value={p.slug} className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
                <div className="flex items-center gap-3">
                  <Switch
                    id={`enabled-${p.slug}`}
                    checked={row.enabled}
                    onCheckedChange={(v) => update(p.slug, { enabled: v })}
                  />
                  <Label htmlFor={`enabled-${p.slug}`} className="cursor-pointer">
                    Show admin content on public {p.title}
                  </Label>
                </div>
                <Button onClick={() => save(p.slug)} disabled={saving === p.slug}>
                  {saving === p.slug ? 'Saving…' : 'Save'}
                </Button>
              </div>
              <BlogEditor
                content={row.content}
                onChange={(html) => update(p.slug, { content: html })}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
