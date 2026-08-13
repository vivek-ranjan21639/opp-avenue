import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface Field {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "url" | "number" | "email";
  placeholder?: string;
  maxLength?: number;
  uppercase?: boolean;
}

interface Props {
  /** Triggers label, e.g. "New Skill" */
  label: string;
  /** Fields to render. If `slug` is included, we auto-fill from `name` until the user edits it. */
  fields?: Field[];
  /** Called with the form values. Should return the created entity (with id) so caller can auto-select it. */
  onCreate: (values: Record<string, any>) => Promise<any>;
  /** Called with the created entity after a successful create. */
  onCreated?: (entity: any) => void;
  /** Optional override for the trigger button. */
  triggerClassName?: string;
}

const DEFAULT_FIELDS: Field[] = [
  { key: "name", label: "Name", required: true },
  { key: "slug", label: "Slug" },
];

export function InlineCreateDialog({ label, fields = DEFAULT_FIELDS, onCreate, onCreated, triggerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const reset = () => setValues({});

  const handleSave = async () => {
    // Required validation
    for (const f of fields) {
      if (f.required && !String(values[f.key] ?? "").trim()) return;
    }
    // Auto-slug if a slug field exists and is empty
    const payload: Record<string, any> = { ...values };
    if (fields.some((f) => f.key === "slug") && !payload.slug && payload.name) {
      payload.slug = slugify(String(payload.name));
    }
    setSubmitting(true);
    try {
      const created = await onCreate(payload);
      if (created && onCreated) onCreated(created);
      reset();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={triggerClassName}>
          <Plus className="h-4 w-4 mr-1" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <Label>{f.label}{f.required ? " *" : ""}</Label>
              <Input
                type={f.type || "text"}
                value={values[f.key] ?? ""}
                maxLength={f.maxLength}
                placeholder={f.placeholder}
                onChange={(e) => {
                  let v: any = e.target.value;
                  if (f.uppercase) v = String(v).toUpperCase();
                  setValues((prev) => {
                    const next = { ...prev, [f.key]: v };
                    // Keep slug in sync with name until user edits it manually
                    if (f.key === "name" && fields.some((x) => x.key === "slug") && !prev._slugTouched) {
                      next.slug = slugify(String(v));
                    }
                    if (f.key === "slug") next._slugTouched = true;
                    return next;
                  });
                }}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
