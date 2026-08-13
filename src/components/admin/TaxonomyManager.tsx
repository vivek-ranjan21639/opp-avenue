import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionsToolbar, downloadCsv } from "@/components/admin/BulkActionsToolbar";

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface Item { id: string; name: string; slug: string; }

interface Props {
  title: string;
  singular: string;
  items: Item[];
  isLoading: boolean;
  onUpsert: (item: { id?: string; name: string; slug: string }) => Promise<any> | any;
  onDelete: (id: string) => Promise<any> | any;
}

export function TaxonomyManager({ title, singular, items, isLoading, onUpsert, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; name: string; slug: string } | null>(null);
  const sel = useRowSelection(items);

  const openNew = () => { setEditing({ name: "", slug: "" }); setOpen(true); };
  const openEdit = (it: Item) => { setEditing({ id: it.id, name: it.name, slug: it.slug }); setOpen(true); };

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) return;
    const slug = editing.slug.trim() || slugify(editing.name);
    await onUpsert({ ...editing, slug });
    setOpen(false);
    setEditing(null);
  };

  const handleBulkDelete = async () => {
    for (const id of sel.selectedIds) {
      await onDelete(id);
    }
    sel.clear();
  };

  const handleExport = () => {
    downloadCsv(`${title.toLowerCase().replace(/\s+/g, '-')}.csv`, sel.selectedRows.map((r) => ({ id: r.id, name: r.name, slug: r.slug })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> New {singular}</Button>
      </div>

      <BulkActionsToolbar
        count={sel.count}
        onClear={sel.clear}
        onDelete={handleBulkDelete}
        onExport={handleExport}
        itemNoun={singular.toLowerCase()}
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No {title.toLowerCase()} yet.</p>
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
                <TableHead>Slug</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id} data-state={sel.isSelected(it.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={sel.isSelected(it.id)}
                      onCheckedChange={() => sel.toggle(it.id)}
                      aria-label={`Select ${it.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{it.name}</TableCell>
                  <TableCell className="text-muted-foreground">{it.slug}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(it)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {singular.toLowerCase()}?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone. Items linked to this {singular.toLowerCase()} may be affected.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(it.id)}>Delete</AlertDialogAction>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? `Edit ${singular}` : `New ${singular}`}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })}
                  placeholder={`${singular} name`}
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="auto-generated-from-name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
