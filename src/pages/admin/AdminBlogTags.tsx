import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { useAdminBlogTags, useUpsertBlogTag, useDeleteBlogTag } from "@/hooks/useAdminData";

export default function AdminBlogTags() {
  const { data = [], isLoading } = useAdminBlogTags();
  const upsert = useUpsertBlogTag();
  const del = useDeleteBlogTag();
  return (
    <TaxonomyManager
      title="Blog Tags"
      singular="Tag"
      items={data as any}
      isLoading={isLoading}
      onUpsert={(item) => upsert.mutateAsync(item)}
      onDelete={(id) => del.mutateAsync(id)}
    />
  );
}
