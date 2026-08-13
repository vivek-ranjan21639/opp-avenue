import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { useAdminSkills, useUpsertSkill, useDeleteSkill } from "@/hooks/useAdminData";

export default function AdminSkills() {
  const { data = [], isLoading } = useAdminSkills();
  const upsert = useUpsertSkill();
  const del = useDeleteSkill();
  return (
    <TaxonomyManager
      title="Job Skills"
      singular="Skill"
      items={data as any}
      isLoading={isLoading}
      onUpsert={(item) => upsert.mutateAsync(item)}
      onDelete={(id) => del.mutateAsync(id)}
    />
  );
}
