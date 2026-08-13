import { useState } from "react";
import {
  useAdminResourceTagGroups,
  useUpsertResourceTagGroup,
  useDeleteResourceTagGroup,
  useAdminResourceTags,
  useUpsertResourceTag,
  useDeleteResourceTag,
} from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

function slugify(t: string) {
  return t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function ResourceTagGroupsManager({ categoryId }: { categoryId: string }) {
  const { data: groups = [] } = useAdminResourceTagGroups(categoryId);
  const { data: allTags = [] } = useAdminResourceTags();
  const upsertGroup = useUpsertResourceTagGroup();
  const delGroup = useDeleteResourceTagGroup();
  const upsertTag = useUpsertResourceTag();
  const delTag = useDeleteResourceTag();

  const [newGroupName, setNewGroupName] = useState("");
  const [newTagByGroup, setNewTagByGroup] = useState<Record<string, string>>({});

  const addGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    await upsertGroup.mutateAsync({
      category_id: categoryId,
      name,
      slug: slugify(name),
      display_order: groups.length,
    });
    setNewGroupName("");
  };

  const addTag = async (groupId: string) => {
    const name = (newTagByGroup[groupId] || "").trim();
    if (!name) return;
    await upsertTag.mutateAsync({ name, slug: slugify(name), group_id: groupId });
    setNewTagByGroup((m) => ({ ...m, [groupId]: "" }));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="New filter group (e.g. Level, Provider)"
        />
        <Button onClick={addGroup} disabled={!newGroupName.trim() || upsertGroup.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Add Group
        </Button>
      </div>

      <Separator />

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tag groups yet. Add one above to create filters for this category.</p>
      ) : (
        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
          {groups.map((g: any) => {
            const tags = (allTags as any[]).filter((t) => t.group_id === g.id);
            return (
              <div key={g.id} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold">{g.name}</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete group "${g.name}"? Tags inside will become ungrouped.`)) {
                        delGroup.mutate(g.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <Badge key={t.id} variant="secondary" className="gap-1">
                      {t.name}
                      <button
                        type="button"
                        onClick={() => delTag.mutate(t.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-xs text-muted-foreground">No tags yet.</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTagByGroup[g.id] || ""}
                    onChange={(e) => setNewTagByGroup((m) => ({ ...m, [g.id]: e.target.value }))}
                    placeholder="New tag name"
                    className="h-8"
                  />
                  <Button size="sm" onClick={() => addTag(g.id)} disabled={!(newTagByGroup[g.id] || "").trim()}>
                    Add Tag
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
