import { useAdminBlogs, useDeleteBlog, useBulkDelete, useBulkUpdate } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionsToolbar, downloadCsv } from "@/components/admin/BulkActionsToolbar";

const INVALIDATE = [['admin-blogs'], ['admin-stats']];

export default function AdminBlogs() {
  const { data: blogs = [], isLoading } = useAdminBlogs();
  const deleteBlog = useDeleteBlog();
  const bulkDel = useBulkDelete('b_blogs', INVALIDATE);
  const bulkUpd = useBulkUpdate('b_blogs', INVALIDATE);
  const sel = useRowSelection<any>(blogs as any[]);
  const navigate = useNavigate();

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
    downloadCsv('blogs.csv', sel.selectedRows.map((b: any) => ({
      id: b.id, title: b.title, slug: b.slug, category: (b.b_categories as any)?.name,
      status: b.status, published_at: b.published_at,
    })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blogs</h1>
        <Button onClick={() => navigate('/admin/blogs/edit')}>
          <Plus className="h-4 w-4 mr-2" /> New Blog
        </Button>
      </div>

      <BulkActionsToolbar
        count={sel.count}
        onClear={sel.clear}
        onDelete={handleBulkDelete}
        onExport={handleExport}
        itemNoun="blog"
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
      ) : blogs.length === 0 ? (
        <p className="text-muted-foreground">No blogs yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={sel.allChecked ? true : sel.someChecked ? "indeterminate" : false}
                    onCheckedChange={() => sel.toggleAll()}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(blogs as any[]).map((blog: any) => (
                <TableRow key={blog.id} data-state={sel.isSelected(blog.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={sel.isSelected(blog.id)}
                      onCheckedChange={() => sel.toggle(blog.id)}
                      aria-label={`Select ${blog.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{blog.title}</TableCell>
                  <TableCell>{(blog.b_categories as any)?.name || '—'}</TableCell>
                  <TableCell><Badge variant={blog.status === 'published' ? 'default' : 'secondary'}>{blog.status}</Badge></TableCell>
                  <TableCell>{blog.published_at ? format(new Date(blog.published_at), 'MMM d, yyyy') : '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete blog?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteBlog.mutate(blog.id)}>Delete</AlertDialogAction>
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
    </div>
  );
}
