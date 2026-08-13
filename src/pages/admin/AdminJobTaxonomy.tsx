import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useJobTaxonomy, useUpsertTaxonomy, useDeleteTaxonomy, TaxonomyKind, TaxonomyOption } from "@/hooks/useJobTaxonomy";
import { useToast } from "@/hooks/use-toast";

const KIND_LABEL: Record<TaxonomyKind, string> = {
  job_type: "Job Type",
  work_mode: "Work Mode",
  experience_level: "Experience Level",
};

function KindEditor({ kind }: { kind: TaxonomyKind }) {
  const { toast } = useToast();
  const { data: items = [], isLoading } = useJobTaxonomy(kind);
  const upsert = useUpsertTaxonomy();
  const remove = useDeleteTaxonomy();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<TaxonomyOption> | null>(null);

  const openNew = () => { setEditing({ kind, value: "", label: "", display_order: items.length + 1 }); setOpen(true); };
  const openEdit = (it: TaxonomyOption) => { setEditing({ ...it }); setOpen(true); };

  const handleSave = async () => {
    if (!editing?.label?.trim()) { toast({ title: "Label required", variant: "destructive" }); return; }
    const value = (editing.value?.trim() || editing.label.trim()).toLowerCase().replace(/\s+/g, "_");
    try {
      await upsert.mutateAsync({ ...editing, kind, value, label: editing.label } as any);
      toast({ title: "Saved" });
      setOpen(false); setEditing(null);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{KIND_LABEL[kind]} options</CardTitle>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Option</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Order</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Stored value</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.display_order}</TableCell>
                  <TableCell className="font-medium">{it.label}</TableCell>
                  <TableCell><code className="text-xs">{it.value}</code></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{it.label}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Existing jobs that use this value will keep the raw value, but it won't appear in the dropdown anymore.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate(it.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-muted-foreground text-center">No options yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit option" : "New option"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Display label *</Label>
                <Input value={editing.label || ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="e.g. Full Time" />
              </div>
              <div>
                <Label>Stored value (optional)</Label>
                <Input value={editing.value || ""} onChange={(e) => setEditing({ ...editing, value: e.target.value })} placeholder="auto from label" />
                <p className="text-xs text-muted-foreground mt-1">Lowercase identifier used in the database. Leave blank to auto-generate from label.</p>
              </div>
              <div>
                <Label>Display order</Label>
                <Input type="number" value={editing.display_order ?? 0} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function AdminJobTaxonomy() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Job Field Options</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Manage the dropdown options shown in the Job editor for Job Type, Work Mode, and Experience Level. Add custom options or rename the existing ones.
      </p>
      <Tabs defaultValue="job_type" className="space-y-4">
        <TabsList>
          <TabsTrigger value="job_type">Job Type</TabsTrigger>
          <TabsTrigger value="work_mode">Work Mode</TabsTrigger>
          <TabsTrigger value="experience_level">Experience Level</TabsTrigger>
        </TabsList>
        <TabsContent value="job_type"><KindEditor kind="job_type" /></TabsContent>
        <TabsContent value="work_mode"><KindEditor kind="work_mode" /></TabsContent>
        <TabsContent value="experience_level"><KindEditor kind="experience_level" /></TabsContent>
      </Tabs>
    </div>
  );
}
