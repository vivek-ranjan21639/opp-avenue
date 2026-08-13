import { useEffect, useState } from "react";
import { useResourceCategories } from "@/hooks/useResources";
import ResourceTagGroupsManager from "@/components/admin/ResourceTagGroupsManager";
import { cn } from "@/lib/utils";

export default function AdminResourceTags() {
  const { data: categories = [] } = useResourceCategories();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId && categories.length > 0) setActiveId(categories[0].id);
  }, [categories, activeId]);

  const active = categories.find((c) => c.id === activeId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resource Tags</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Tags are organised under each resource category. Pick a category to manage its tag groups and tags.
      </p>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">No resource categories yet. Create one first.</p>
      ) : (
        <>
          <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background border-b">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap border transition-colors",
                    activeId === c.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-muted"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {active && (
            <div className="rounded-md border border-input p-4 space-y-3">
              <div>
                <h2 className="text-lg font-semibold">{active.name}</h2>
                <p className="text-xs text-muted-foreground">
                  Add tag groups (filters shown on this category's page) and tags within each group.
                </p>
              </div>
              <ResourceTagGroupsManager categoryId={active.id} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
