import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { useAdminBlogCategories, useUpsertBlogCategory, useDeleteBlogCategory } from "@/hooks/useAdminData";

export default function AdminBlogCategories() {
  const { data = [], isLoading } = useAdminBlogCategories();
  const upsert = useUpsertBlogCategory();
  const del = useDeleteBlogCategory();
  return (
    <TaxonomyManager
      title="Blog Categories"
      singular="Category"
      items={data as any}
      isLoading={isLoading}
      onUpsert={(item) => upsert.mutateAsync(item)}
      onDelete={(id) => del.mutateAsync(id)}
    />
  );
}
