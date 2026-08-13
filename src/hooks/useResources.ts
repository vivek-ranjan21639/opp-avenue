import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResourceFieldConfig {
  thumbnail?: boolean;
  title?: boolean;
  description?: boolean;
  notes?: boolean;
  tags?: boolean;
  link?: boolean;
  file?: boolean;
  content?: boolean;
  linked?: boolean;
}

export const DEFAULT_FIELD_CONFIG: ResourceFieldConfig = {
  thumbnail: true, title: true, description: true,
  notes: false, tags: true, link: true, file: false, content: false, linked: true,
};

export interface ResourceTagGroup {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  display_order: number;
}

export interface Resource {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  notes: string | null;
  resource_type: string;
  status: string;
  category_id: string | null;
  display_order: number | null;
  whats_new: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  r_categories?: { id: string; name: string; slug: string } | null;
  r_resource_files?: ResourceFile[];
  r_resource_tags_map?: { r_tags: { id: string; name: string; slug: string; group_id: string | null } }[];
}

export interface ResourceFile {
  id: string;
  file_url: string | null;
  file_type: string | null;
  mime_type: string | null;
  is_downloadable: boolean | null;
  storage_type: string;
}

export interface ResourceCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  display_order?: number | null;
  is_filled?: boolean | null;
  default_view?: 'list' | 'grid' | null;
  field_config?: ResourceFieldConfig | null;
}

export const publishedResourcesQueryKey = (categorySlug?: string) => ['published-resources', categorySlug] as const;

export const fetchPublishedResources = async (categorySlug?: string) => {
  let query = supabase
    .from('r_resources')
    .select(`
      id, title, slug, description, content, notes, resource_type, status, category_id, display_order, whats_new, video_url, thumbnail_url, published_at, created_at, updated_at,
      r_categories(id, name, slug, field_config),
      r_resource_files(id, file_url, file_type, mime_type, is_downloadable, storage_type),
      r_resource_tags_map(r_tags(id, name, slug, group_id))
    `)
    .eq('status', 'published')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (categorySlug) {
    // First get the category id
    const { data: cat } = await supabase
      .from('r_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (cat) {
      query = query.eq('category_id', cat.id);
    } else {
      return [];
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Resource[];
};

export const publishedResourcesQueryOptions = (categorySlug?: string) => ({
  queryKey: publishedResourcesQueryKey(categorySlug),
  queryFn: () => fetchPublishedResources(categorySlug),
});

// Fetch all published resources, optionally filtered by category slug
export const usePublishedResources = (categorySlug?: string) => {
  return useQuery(publishedResourcesQueryOptions(categorySlug));
};

export const resourceCategoriesQueryOptions = () => ({
  queryKey: ['resource-categories'] as const,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('r_categories')
      .select('id, name, slug, created_at, display_order, is_filled, default_view, field_config')
      .order('display_order', { ascending: true })
      .order('name');
    if (error) throw error;
    return (data || []) as unknown as ResourceCategory[];
  },
});

// Fetch all resource categories
export const useResourceCategories = () => {
  return useQuery(resourceCategoriesQueryOptions());
};

export const resourceTagGroupsQueryOptions = (categoryId?: string | null) => ({
  queryKey: ['resource-tag-groups', categoryId] as const,
  queryFn: async () => {
    const { data: groups, error: gErr } = await (supabase as any)
      .from('r_tag_groups')
      .select('id, category_id, name, slug, display_order')
      .eq('category_id', categoryId)
      .order('display_order', { ascending: true });
    if (gErr) throw gErr;
    const groupIds = (groups || []).map((g: any) => g.id);
    let tags: any[] = [];
    if (groupIds.length) {
      const { data: t, error: tErr } = await (supabase as any)
        .from('r_tags')
        .select('id, name, slug, group_id')
        .in('group_id', groupIds)
        .order('name');
      if (tErr) throw tErr;
      tags = t || [];
    }
    return (groups || []).map((g: any) => ({
      ...g,
      tags: tags.filter((t) => t.group_id === g.id),
    })) as (ResourceTagGroup & { tags: { id: string; name: string; slug: string; group_id: string }[] })[];
  },
});

// Fetch tag groups (with their tags) for a category
export const useResourceTagGroups = (categoryId?: string | null) => {
  return useQuery({
    ...resourceTagGroupsQueryOptions(categoryId),
    enabled: !!categoryId,
  });
};

export const resourceBySlugQueryKey = (slug: string | undefined) => ['resource', slug] as const;

export const resourceBySlugQueryOptions = (slug: string | undefined) => ({
  queryKey: resourceBySlugQueryKey(slug),
  queryFn: async () => {
    if (!slug) return null;
    const { data, error } = await supabase
      .from('r_resources')
      .select(`
        *,
        r_categories(id, name, slug, field_config),
        r_resource_files(*),
        r_resource_tags_map(r_tags(id, name, slug, group_id))
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    if (error) throw error;
    return data as unknown as Resource;
  },
});

// Fetch single resource by slug
export const useResourceBySlug = (slug: string | undefined) => {
  return useQuery({
    ...resourceBySlugQueryOptions(slug),
    enabled: !!slug,
  });
};

export const featuredResourcesQueryOptions = () => ({
  queryKey: ['featured-resources'] as const,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('r_resources')
      .select(`id, title, slug, whats_new, updated_at, r_categories(id, name, slug)`)
      .eq('status', 'published')
      .not('whats_new', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return (data || []) as Resource[];
  },
});

// Fetch "What's New" resources
export const useFeaturedResources = () => {
  return useQuery(featuredResourcesQueryOptions());
};

// Keep backward compat
export const useNewResources = useFeaturedResources;
