import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  summary: string | null;
  thumbnail_url: string | null;
  status: string;
  featured: boolean;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  read_time_minutes?: number;
  category_id?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  author: {
    id: string;
    name: string;
    bio: string | null;
    profile_pic_url: string | null;
    profile_url: string | null;
  } | null;
  authors: {
    id: string;
    name: string;
    bio: string | null;
    profile_pic_url: string | null;
    profile_url: string | null;
    email: string | null;
    show_email: boolean;
  }[];
  tags: {
    id: string;
    name: string;
  }[];
}

export const calculateReadTime = (content: string | null): number => {
  if (!content) return 1;
  const text = content.replace(/<[^>]*>/g, '');
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

async function fetchAuthorsForMaps(maps: { author_id?: string; b_authors_public?: any }[]): Promise<any[]> {
  const ids = Array.from(
    new Set(maps.map((m) => m?.author_id).filter(Boolean) as string[])
  );
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('b_authors')
    .select('id, name, bio, profile_image, profile_link, show_email')
    .in('id', ids);
  if (error) throw error;
  return (data as any[]) || [];
}

function shapeAuthor(a: any) {
  return {
    id: a.id,
    name: a.name,
    bio: a.bio,
    profile_pic_url: a.profile_image,
    profile_url: a.profile_link,
    email: null,
    show_email: !!a.show_email,
  };
}

export const blogsQueryKey = (tagFilter?: string | null) => ['blogs', tagFilter] as const;

export const fetchBlogs = async (tagFilter?: string | null): Promise<Blog[]> => {
  const { data: blogs, error } = await supabase
    .from('b_blogs')
    .select(`
      id, title, slug, summary, thumbnail_url, status, published_at, created_at, updated_at, category_id,
      b_blog_tags_map(b_tags(id, name)),
      b_blog_authors_map(author_id),
      b_categories(id, name, slug)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;
  if (!blogs) return [];

  // Collect all author ids across blogs and fetch in one query
  const allMaps = blogs.flatMap((b: any) => b.b_blog_authors_map || []);
  const authors = await fetchAuthorsForMaps(allMaps);
  const authorById = new Map(authors.map((a) => [a.id, a]));

  return blogs.map((blog: any) => {
    const tags = (blog.b_blog_tags_map || [])
      .map((m: any) => m.b_tags)
      .filter(Boolean);

    const authorsList = (blog.b_blog_authors_map || [])
      .map((m: any) => authorById.get(m.author_id))
      .filter(Boolean)
      .map(shapeAuthor);
    const author = authorsList[0] || null;

    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      content: null,
      summary: blog.summary,
      thumbnail_url: blog.thumbnail_url,
      status: blog.status,
      featured: false,
      view_count: 0,
      published_at: blog.published_at,
      created_at: blog.created_at,
      updated_at: blog.updated_at,
      read_time_minutes: calculateReadTime(blog.summary),
      category_id: blog.category_id,
      category: blog.b_categories || null,
      author,
      authors: authorsList,
      tags,
    };
  });
};

export const blogsQueryOptions = (tagFilter?: string | null) => ({
  queryKey: blogsQueryKey(tagFilter),
  queryFn: () => fetchBlogs(tagFilter),
});

export const useBlogs = (tagFilter?: string | null) => {
  return useQuery(blogsQueryOptions(tagFilter));
};

export const blogQueryKey = (slug: string | undefined) => ['blog', slug] as const;

export const fetchBlog = async (slug: string | undefined): Promise<Blog | null> => {
  if (!slug) return null;
  const { data: blog, error } = await supabase
    .from('b_blogs')
    .select(`
      *,
      b_blog_tags_map(b_tags(id, name)),
      b_blog_authors_map(author_id)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw error;
  if (!blog) return null;

  const tags = (blog.b_blog_tags_map || [])
    .map((m: any) => m.b_tags)
    .filter(Boolean);

  const authors = await fetchAuthorsForMaps(((blog as any).b_blog_authors_map as any[]) || []);
  const authorById = new Map(authors.map((a) => [a.id, a]));

  const authorsList = (((blog as any).b_blog_authors_map as any[]) || [])
    .map((m: any) => authorById.get(m.author_id))
    .filter(Boolean)
    .map(shapeAuthor);
  const author = authorsList[0] || null;

  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    summary: blog.summary,
    thumbnail_url: blog.thumbnail_url,
    status: blog.status,
    featured: false,
    view_count: 0,
    published_at: blog.published_at,
    created_at: blog.created_at,
    updated_at: blog.updated_at,
    read_time_minutes: calculateReadTime(blog.content),
    category_id: blog.category_id,
    author,
    authors: authorsList,
    tags,
  };
};

export const blogQueryOptions = (slug: string | undefined) => ({
  queryKey: blogQueryKey(slug),
  queryFn: () => fetchBlog(slug),
});

export const useBlog = (slug: string | undefined) => {
  return useQuery({
    ...blogQueryOptions(slug),
    enabled: !!slug,
  });
};

export const blogTagsQueryOptions = () => ({
  queryKey: ['blog-tags'] as const,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('b_tags')
      .select('id, name')
      .order('name');
    if (error) throw error;
    return data || [];
  },
});

export const useBlogTags = () => {
  return useQuery(blogTagsQueryOptions());
};

export const blogCategoriesQueryOptions = () => ({
  queryKey: ['blog-categories'] as const,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('b_categories')
      .select('id, name, slug')
      .order('name');
    if (error) throw error;
    return data || [];
  },
});

export const useBlogCategories = () => {
  return useQuery(blogCategoriesQueryOptions());
};
