import { useState } from "react";
import { useAdminBlogAuthors, useUpsertBlogAuthor, useDeleteBlogAuthor, useBulkDelete } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionsToolbar, downloadCsv } from "@/components/admin/BulkActionsToolbar";

interface AuthorForm {
  id?: string;
  name: string;
  email: string;
  show_email: boolean;
  bio: string;
  profile_image: string;
  profile_link: string;
}

const empty: AuthorForm = { name: "", email: "", show_email: false, bio: "", profile_image: "", profile_link: "" };

export default function AdminBlogAuthors() {
  const { data = [], isLoading } = useAdminBlogAuthors();
  const upsert = useUpsertBlogAuthor();
  const del = useDeleteBlogAuthor();
  const bulkDel = useBulkDelete('b_authors', [['admin-blog-authors']]);
  const sel = useRowSelection<any>(data as any[]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AuthorForm>(empty);

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (a: any) => {
    setForm({
      id: a.id,
      name: a.name || "",
      email: a.email || "",
      show_email: !!a.show_email,
      bio: a.bio || "",
      profile_image: a.profile_image || "",
      profile_link: a.profile_link || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await upsert.mutateAsync({
      id: form.id,
      name: form.name.trim(),
      email: form.email || null,
      show_email: form.show_email,
      bio: form.bio || null,
      profile_image: form.profile_image || null,
      profile_link: form.profile_link || null,
    });
    setOpen(false);
    setForm(empty);
  };

  const handleBulkDelete = async () => { await bulkDel.mutateAsync(sel.selectedIds); sel.clear(); };
  const handleExport = () => {
    downloadCsv('blog-authors.csv', sel.selectedRows.map((a: any) => ({
      id: a.id, name: a.name, email: a.email, show_email: a.show_email, profile_link: a.profile_link,
    })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blog Authors</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> New Author</Button>
      </div>

      <BulkActionsToolbar
        count={sel.count}
        onClear={sel.clear}
        onDelete={handleBulkDelete}
        onExport={handleExport}
        itemNoun="author"
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (data as any[]).length === 0 ? (
        <p className="text-muted-foreground">No authors yet.</p>
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Public Email</TableHead>
                <TableHead>Profile Link</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data as any[]).map((a) => (
                <TableRow key={a.id} data-state={sel.isSelected(a.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={sel.isSelected(a.id)}
                      onCheckedChange={() => sel.toggle(a.id)}
                      aria-label={`Select ${a.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.email || '—'}</TableCell>
                  <TableCell>
                    {a.show_email ? (
                      <Badge variant="secondary" className="gap-1"><Eye className="h-3 w-3" /> Visible</Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground"><EyeOff className="h-3 w-3" /> Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[260px]">{a.profile_link || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete author?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => del.mutate(a.id)}>Delete</AlertDialogAction>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Author' : 'New Author'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-0.5">
                <Label className="cursor-pointer">Show email publicly</Label>
                <p className="text-xs text-muted-foreground">When off, this email is hidden from public blog pages.</p>
              </div>
              <Switch
                checked={form.show_email}
                onCheckedChange={(checked) => setForm({ ...form, show_email: checked })}
                disabled={!form.email}
              />
            </div>
            <div>
              <Label>Profile Image URL</Label>
              <Input value={form.profile_image} onChange={(e) => setForm({ ...form, profile_image: e.target.value })} />
            </div>
            <div>
              <Label>Profile Link</Label>
              <Input value={form.profile_link} onChange={(e) => setForm({ ...form, profile_link: e.target.value })} />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
