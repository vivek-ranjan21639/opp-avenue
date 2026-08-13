import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { useAdminDomains, useUpsertDomain, useDeleteDomain } from "@/hooks/useAdminData";

export default function AdminDomains() {
  const { data = [], isLoading } = useAdminDomains();
  const upsert = useUpsertDomain();
  const del = useDeleteDomain();
  return (
    <TaxonomyManager
      title="Job Domains"
      singular="Domain"
      items={data as any}
      isLoading={isLoading}
      onUpsert={(item) => upsert.mutateAsync(item)}
      onDelete={(id) => del.mutateAsync(id)}
    />
  );
}
