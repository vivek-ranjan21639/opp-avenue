import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface BulkActionsToolbarProps {
  count: number;
  /** Reset selection (called by Clear button and by parent after bulk action). */
  onClear: () => void;
  /** Called when the user confirms bulk delete. */
  onDelete?: () => void | Promise<void>;
  /** Called when the user clicks "Export CSV". */
  onExport?: () => void;
  /** Extra page-specific buttons (e.g. Publish / Move to staging). */
  extraActions?: ReactNode;
  /** Singular noun shown in confirm dialog ("job", "blog", "city"…). */
  itemNoun?: string;
}

export function BulkActionsToolbar({
  count,
  onClear,
  onDelete,
  onExport,
  extraActions,
  itemNoun = "item",
}: BulkActionsToolbarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-3 flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-primary/10">
      <span className="text-sm font-medium">
        {count} selected
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {extraActions}

        {onExport && (
          <Button size="sm" variant="outline" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}

        {onDelete && (
          <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        )}

        <Button size="sm" variant="ghost" onClick={onClear} aria-label="Clear selection">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {onDelete && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {count} {itemNoun}{count === 1 ? "" : "s"}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The selected entries will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  await onDelete();
                  setConfirmOpen(false);
                }}
              >
                Delete {count}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

/** Minimal CSV download helper used by admin lists. */
export function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (rows.length === 0) return;
  const headers = Array.from(
    rows.reduce<Set<string>>((acc, r) => {
      Object.keys(r).forEach((k) => acc.add(k));
      return acc;
    }, new Set()),
  );
  const escape = (v: any) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
