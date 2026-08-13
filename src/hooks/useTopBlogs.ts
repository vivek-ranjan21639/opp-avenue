import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateReadTime } from "./useBlogs";

export interface TopBlog {
  id: string;
  title: string;
  slug: string;
  author_id: string;
  thumbnail_url?: string;
  read_time_minutes?: number;
  authors?: {
    name: string;
    profile_pic_url?: string;
    profile_url?: string;
  };
}

type Placement = 'top' | 'featured';

export const fetchPlacedBlogs = async (placement: Placement): Promise<TopBlog[]> => {
  const column = placement === 'top' ? 'is_top' : 'is_featured';
  const { data, error } = await supabase
    .from('b_blogs')
    .select(`
      id, title, slug, summary, thumbnail_url,
      b_blog_authors_map(b_authors(id, name, profile_image, profile_link))
    `)
    .eq('status', 'published')
    .eq(column, true)
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  if (!data) return [];

  return data.map((blog: any) => {
    const authorMap = blog.b_blog_authors_map?.[0]?.b_authors;
    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      author_id: authorMap?.id || '',
      thumbnail_url: blog.thumbnail_url,
      read_time_minutes: calculateReadTime(blog.summary),
      authors: authorMap ? {
        name: authorMap.name,
        profile_pic_url: authorMap.profile_image,
        profile_url: authorMap.profile_link,
      } : undefined,
    };
  });
};

export const topBlogsQueryOptions = () => ({
  queryKey: ['top-blogs'] as const,
  queryFn: () => fetchPlacedBlogs('top'),
});

/** Top blogs — shown on the Job Detail page (b_blogs.is_top = true). */
export const useTopBlogs = (options?: { enabled?: boolean }) => {
  return useQuery({
    ...topBlogsQueryOptions(),
    enabled: options?.enabled ?? true,
  });
};

export const featuredBlogsQueryOptions = () => ({
  queryKey: ['featured-blogs'] as const,
  queryFn: () => fetchPlacedBlogs('featured'),
});

/** Featured blogs — shown on the Blogs page (b_blogs.is_featured = true). */
export const useFeaturedBlogs = (options?: { enabled?: boolean }) => {
  return useQuery({
    ...featuredBlogsQueryOptions(),
    enabled: options?.enabled ?? true,
  });
};
