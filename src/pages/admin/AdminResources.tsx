import { useMemo, useState } from "react";
import { useAdminResources, useDeleteResource, useBulkDelete, useBulkUpdate } from "@/hooks/useAdminData";
import { useResourceCategories } from "@/hooks/useResources";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionsToolbar, downloadCsv } from "@/components/admin/BulkActionsToolbar";

const INVALIDATE = [['admin-resources']];

export default function AdminResources() {
  const { data: resources = [], isLoading } = useAdminResources();
  const { data: categories = [] } = useResourceCategories();
  const deleteResource = useDeleteResource();
  const bulkDel = useBulkDelete('r_resources', INVALIDATE);
  const bulkUpd = useBulkUpdate('r_resources', INVALIDATE);
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<string>('__all__');

  const filtered = useMemo(() => {
    if (activeCategory === '__all__') return resources as any[];
    if (activeCategory === '__none__') return (resources as any[]).filter((r) => !r.category_id);
    return (resources as any[]).filter((r) => r.category_id === activeCategory);
  }, [resources, activeCategory]);

  const sel = useRowSelection<any>(filtered);

  const handleBulkDelete = async () => { await bulkDel.mutateAsync(sel.selectedIds); sel.clear(); };
  const handleBulkPublish = async () => {
    await bulkUpd.mutateAsync({ ids: sel.selectedIds, patch: { status: 'published', published_at: new Date().toISOString() } });
    sel.clear();
  };
  const handleBulkUnpublish = async () => {
    await bulkUpd.mutateAsync({ ids: sel.selectedIds, patch: { status: 'draft' } });
    sel.clear();
  };
  const handleExport = () => {
    downloadCsv('resources.csv', sel.selectedRows.map((r: any) => ({
      id: r.id, title: r.title, slug: r.slug, type: r.resource_type,
      category: (r.r_categories as any)?.name, status: r.status,
    })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Resources</h1>
        <Button onClick={() => navigate('/admin/resources/edit')}>
          <Plus className="h-4 w-4 mr-2" /> New Resource
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 mb-2 -mx-4 px-4 border-b">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button
              variant={activeCategory === '__all__' ? 'default' : 'outline'}
              size="sm"
              className="shrink-0"
              onClick={() => setActiveCategory('__all__')}
            >
              All
            </Button>
            {categories.map((c) => (
              <Button
                key={c.id}
                variant={activeCategory === c.id ? 'default' : 'outline'}
                size="sm"
                className="shrink-0"
                onClick={() => setActiveCategory(c.id)}
              >
                {c.name}
              </Button>
            ))}
            <Button
              variant={activeCategory === '__none__' ? 'default' : 'outline'}
              size="sm"
              className="shrink-0"
              onClick={() => setActiveCategory('__none__')}
            >
              Uncategorized
            </Button>
          </div>
        </div>
      )}

      <BulkActionsToolbar
        count={sel.count}
        onClear={sel.clear}
        onDelete={handleBulkDelete}
        onExport={handleExport}
        itemNoun="resource"
        extraActions={
          <>
            <Button size="sm" variant="outline" onClick={handleBulkUnpublish}>
              <EyeOff className="mr-2 h-4 w-4" /> Unpublish
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkPublish}>
              <Eye className="mr-2 h-4 w-4" /> Publish
            </Button>
          </>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No resources in this category.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((res: any) => (
                <TableRow key={res.id} data-state={sel.isSelected(res.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={sel.isSelected(res.id)}
                      onCheckedChange={() => sel.toggle(res.id)}
                      aria-label={`Select ${res.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{res.title}</TableCell>
                  <TableCell className="text-muted-foreground">{(res.r_categories as any)?.name || '—'}</TableCell>
                  <TableCell><Badge variant={res.status === 'published' ? 'default' : 'secondary'}>{res.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/resources/edit/${res.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete resource?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteResource.mutate(res.id)}>Delete</AlertDialogAction></AlertDialogFooter>
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
    </div>
  );
}
