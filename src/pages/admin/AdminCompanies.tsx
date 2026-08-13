import { useState } from "react";
import { useAdminCompanies, useUpsertCompany, useDeleteCompany, useBulkDelete, useFileUpload } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionsToolbar, downloadCsv } from "@/components/admin/BulkActionsToolbar";

export default function AdminCompanies() {
  const { data: companies = [], isLoading } = useAdminCompanies();
  const upsertCompany = useUpsertCompany();
  const deleteCompany = useDeleteCompany();
  const bulkDel = useBulkDelete('j_companies', [['admin-companies']]);
  const sel = useRowSelection<any>(companies as any[]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const uploadFile = useFileUpload();

  const handleSave = async () => {
    await upsertCompany.mutateAsync(editing);
    setOpen(false);
    setEditing(null);
  };

  const openNew = () => { setEditing({ name: "", slug: "", website: "", logo_url: "", description: "", headquarter: "", employee_count: "", founding_year: "" }); setOpen(true); };
  const openEdit = (c: any) => { setEditing({ ...c }); setOpen(true); };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = editing?.id || 'new-' + Date.now();
    const ext = file.name.split('.').pop() || 'png';
    const path = `entities/companies/${id}/logo/logo_${id}_v1.${ext}`;
    const url = await uploadFile.mutateAsync({ file, path, bucket: 'content' });
    setEditing((p: any) => ({ ...p, logo_url: url }));
  };

  const handleBulkDelete = async () => { await bulkDel.mutateAsync(sel.selectedIds); sel.clear(); };
  const handleExport = () => {
    downloadCsv('companies.csv', sel.selectedRows.map((c: any) => ({
      id: c.id, name: c.name, slug: c.slug, website: c.website, headquarter: c.headquarter,
    })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Companies</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Company</Button>
      </div>

      <BulkActionsToolbar
        count={sel.count}
        onClear={sel.clear}
        onDelete={handleBulkDelete}
        onExport={handleExport}
        itemNoun="company"
      />

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : companies.length === 0 ? <p className="text-muted-foreground">No companies yet.</p> : (
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
              <TableHead>Website</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {(companies as any[]).map((c: any) => (
                <TableRow key={c.id} data-state={sel.isSelected(c.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={sel.isSelected(c.id)}
                      onCheckedChange={() => sel.toggle(c.id)}
                      aria-label={`Select ${c.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.website || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete company?</AlertDialogTitle><AlertDialogDescription>All linked jobs will be unlinked.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteCompany.mutate(c.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Company" : "New Company"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name *</Label><Input value={editing.name} onChange={(e) => setEditing((p: any) => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Slug *</Label><Input value={editing.slug} onChange={(e) => setEditing((p: any) => ({ ...p, slug: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {editing.logo_url && (
                    <img src={editing.logo_url} alt="Logo" className="w-12 h-12 rounded-md object-cover border" />
                  )}
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} className="flex-1" />
                </div>
                <Input className="mt-2" placeholder="…or paste logo URL" value={editing.logo_url || ""} onChange={(e) => setEditing((p: any) => ({ ...p, logo_url: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Website</Label><Input value={editing.website || ""} onChange={(e) => setEditing((p: any) => ({ ...p, website: e.target.value }))} /></div>
                <div><Label>Headquarter</Label><Input value={editing.headquarter || ""} onChange={(e) => setEditing((p: any) => ({ ...p, headquarter: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Employee Count</Label><Input value={editing.employee_count || ""} onChange={(e) => setEditing((p: any) => ({ ...p, employee_count: e.target.value }))} placeholder="e.g. 50-200" /></div>
                <div><Label>Founding Year</Label><Input type="number" value={editing.founding_year || ""} onChange={(e) => setEditing((p: any) => ({ ...p, founding_year: e.target.value ? Number(e.target.value) : null }))} /></div>
              </div>
              <div><Label>Description</Label><Textarea rows={4} value={editing.description || ""} onChange={(e) => setEditing((p: any) => ({ ...p, description: e.target.value }))} /></div>
              <Button onClick={handleSave} disabled={upsertCompany.isPending} className="w-full">{upsertCompany.isPending ? "Saving..." : "Save"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
