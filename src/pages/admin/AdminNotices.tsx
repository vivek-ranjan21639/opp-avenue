import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminNotices, useUpsertNotice, useDeleteNotice,
  NOTICE_PAGE_OPTIONS, AdminNotice,
} from "@/hooks/useNotices";

export default function AdminNotices() {
  const { data = [], isLoading } = useAdminNotices();
  const upsert = useUpsertNotice();
  const del = useDeleteNotice();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AdminNotice> | null>(null);

  const openNew = () => {
    setEditing({
      message: "",
      link_url: "",
      is_active: true,
      target_pages: [],
      display_order: 0,
      starts_at: null,
      ends_at: null,
    });
    setOpen(true);
  };

  const openEdit = (n: AdminNotice) => {
    setEditing({ ...n });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!editing?.message?.trim()) {
      toast({ title: "Message required", variant: "destructive" });
      return;
    }
    try {
      await upsert.mutateAsync(editing as any);
      toast({ title: "Notice saved" });
      setOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const togglePage = (page: string) => {
    if (!editing) return;
    const cur = editing.target_pages || [];
    const next = cur.includes(page) ? cur.filter((p) => p !== page) : [...cur, page];
    setEditing({ ...editing, target_pages: next });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Highlighted clickable banner shown above the header on selected pages. Visitors can dismiss for their session.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> New Notice
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">No notices yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Message</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead className="w-[80px]">Active</TableHead>
                <TableHead className="w-[80px]">Order</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>
                    <div className="font-medium line-clamp-2">{n.message}</div>
                    {n.link_url && (
                      <div className="text-xs text-muted-foreground truncate max-w-md">{n.link_url}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(n.target_pages || []).map((p) => (
                        <Badge key={p} variant="secondary" className="text-[10px]">
                          {NOTICE_PAGE_OPTIONS.find((o) => o.value === p)?.label || p}
                        </Badge>
                      ))}
                      {(!n.target_pages || n.target_pages.length === 0) && (
                        <span className="text-xs text-muted-foreground italic">none</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{n.is_active ? "Yes" : "No"}</TableCell>
                  <TableCell className="font-mono text-xs">{n.display_order}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(n)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete notice?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => del.mutate(n.id)}>Delete</AlertDialogAction>
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Notice" : "New Notice"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Message *</Label>
                <Textarea
                  value={editing.message || ""}
                  onChange={(e) => setEditing({ ...editing, message: e.target.value })}
                  rows={2}
                  placeholder="Short attention-grabbing message"
                />
              </div>
              <div>
                <Label>Link URL (opens in new tab)</Label>
                <Input
                  type="url"
                  value={editing.link_url || ""}
                  onChange={(e) => setEditing({ ...editing, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Show on these pages</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 rounded-md border border-input p-3">
                  {NOTICE_PAGE_OPTIONS.map((p) => (
                    <label key={p.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={(editing.target_pages || []).includes(p.value)}
                        onCheckedChange={() => togglePage(p.value)}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Starts at (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={editing.starts_at ? editing.starts_at.slice(0, 16) : ""}
                    onChange={(e) =>
                      setEditing({ ...editing, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                  />
                </div>
                <div>
                  <Label>Ends at (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={editing.ends_at ? editing.ends_at.slice(0, 16) : ""}
                    onChange={(e) =>
                      setEditing({ ...editing, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={editing.display_order ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, display_order: parseInt(e.target.value || "0", 10) })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border border-input p-3">
                  <Label>Active</Label>
                  <Switch
                    checked={!!editing.is_active}
                    onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={upsert.isPending}>
                  {upsert.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
