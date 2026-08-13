import { useState } from "react";
import { useAdminSources, useUpsertSource, useDeleteSource, useAdminCompanies } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminSources() {
  const { data: sources = [], isLoading } = useAdminSources();
  const { data: companies = [] } = useAdminCompanies();
  const upsertSource = useUpsertSource();
  const deleteSource = useDeleteSource();
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    await upsertSource.mutateAsync(editing);
    setOpen(false);
    setEditing(null);
  };

  const openNew = () => { setEditing({ name: "", base_url: "", source_type: "manual", company_id: null }); setOpen(true); };
  const openEdit = (s: any) => { setEditing({ id: s.id, name: s.name, base_url: s.base_url, source_type: s.source_type, company_id: s.company_id }); setOpen(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Job Sources</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Source</Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : sources.length === 0 ? <p className="text-muted-foreground">No sources yet.</p> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>URL</TableHead><TableHead>Company</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {sources.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline">{s.source_type}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate">{s.base_url || '—'}</TableCell>
                  <TableCell>{(s.j_companies as any)?.name || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete source?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteSource.mutate(s.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Source" : "New Source"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={editing.name} onChange={(e) => setEditing((p: any) => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Base URL</Label><Input value={editing.base_url || ""} onChange={(e) => setEditing((p: any) => ({ ...p, base_url: e.target.value }))} /></div>
              <div>
                <Label>Source Type</Label>
                <Select value={editing.source_type} onValueChange={(v) => setEditing((p: any) => ({ ...p, source_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["scraper","api","manual","rss"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Linked Company</Label>
                <Select value={editing.company_id || ""} onValueChange={(v) => setEditing((p: any) => ({ ...p, company_id: v || null }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={upsertSource.isPending} className="w-full">{upsertSource.isPending ? "Saving..." : "Save"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
