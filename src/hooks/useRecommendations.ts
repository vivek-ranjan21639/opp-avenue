import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateReadTime } from "./useBlogs";
import type { TopBlog } from "./useTopBlogs";
import type { Job } from "@/components/JobCard";
import { formatDistanceToNow } from "date-fns";
import { formatSalaryLPA, toTitleCase } from "@/lib/salary";

export interface RecommendedBlogsParams {
  currentBlogId?: string;
  categoryId?: string | null;
  authorIds?: string[];
  tagIds?: string[];
  limit?: number;
}

export const recommendedBlogsQueryKey = ({
  currentBlogId,
  categoryId,
  authorIds = [],
  tagIds = [],
}: RecommendedBlogsParams) => ['recommended-blogs', currentBlogId, categoryId, authorIds, tagIds] as const;

export const fetchRecommendedBlogs = async (params: RecommendedBlogsParams): Promise<TopBlog[]> => {
  const { currentBlogId, categoryId, authorIds = [], tagIds = [], limit = 10 } = params;
  if (!currentBlogId) return [];
  const ids = new Set<string>();

  const fetchBlogs = async (blogIds: string[]) => {
    if (blogIds.length === 0) return [];
    const { data } = await supabase
      .from('b_blogs')
      .select(`
        id, title, slug, content, thumbnail_url, published_at,
        b_blog_authors_map(b_authors(id, name, profile_image, profile_link))
      `)
      .in('id', blogIds)
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    return data || [];
  };

  // 1. By tags
  if (tagIds.length > 0) {
    const { data } = await supabase
      .from('b_blog_tags_map')
      .select('blog_id')
      .in('tag_id', tagIds);
    (data || []).forEach((r: any) => {
      if (r.blog_id !== currentBlogId) ids.add(r.blog_id);
    });
  }

  // 2. By authors
  if (authorIds.length > 0) {
    const { data } = await supabase
      .from('b_blog_authors_map')
      .select('blog_id')
      .in('author_id', authorIds);
    (data || []).forEach((r: any) => {
      if (r.blog_id !== currentBlogId) ids.add(r.blog_id);
    });
  }

  // 3. By category
  if (categoryId) {
    const { data } = await supabase
      .from('b_blogs')
      .select('id')
      .eq('category_id', categoryId)
      .eq('status', 'published')
      .neq('id', currentBlogId)
      .limit(20);
    (data || []).forEach((r: any) => ids.add(r.id));
  }

  let blogs = await fetchBlogs(Array.from(ids).slice(0, 30));

  // Fallback: when no matches, suggest top 5 blogs with the highest read time
  if (blogs.length === 0) {
    const { data } = await supabase
      .from('b_blogs')
      .select(`
        id, title, slug, content, thumbnail_url, published_at,
        b_blog_authors_map(b_authors(id, name, profile_image, profile_link))
      `)
      .eq('status', 'published')
      .neq('id', currentBlogId)
      .limit(50);
    const ranked = (data || [])
      .map((b: any) => ({ ...b, _rt: calculateReadTime(b.content) }))
      .sort((a: any, b: any) => (b._rt || 0) - (a._rt || 0))
      .slice(0, 5);
    blogs = ranked;
  }

  return blogs.slice(0, limit).map((blog: any) => {
    const a = blog.b_blog_authors_map?.[0]?.b_authors;
    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      author_id: a?.id || '',
      thumbnail_url: blog.thumbnail_url,
      read_time_minutes: calculateReadTime(blog.content),
      authors: a ? {
        name: a.name,
        profile_pic_url: a.profile_image,
        profile_url: a.profile_link,
      } : undefined,
    };
  });
};

export const recommendedBlogsQueryOptions = (params: RecommendedBlogsParams) => ({
  queryKey: recommendedBlogsQueryKey(params),
  queryFn: () => fetchRecommendedBlogs(params),
});

export const useRecommendedBlogs = (params: RecommendedBlogsParams) => {
  const { currentBlogId } = params;
  return useQuery({
    ...recommendedBlogsQueryOptions(params),
    enabled: !!currentBlogId,
  });
};

export const recentJobsQueryOptions = (limit = 10) => ({
  queryKey: ['recent-jobs', limit] as const,
  queryFn: async (): Promise<Job[]> => {
      const { data, error } = await supabase
        .from('j_jobs')
        .select(`
          *,
          j_companies(id, name, logo_url, slug),
          j_job_skills_map(j_skills(id, name)),
          j_job_domains_map(j_domains(id, name)),
          j_job_locations_map(j_cities(id, name, j_states(name), j_countries(name))),
          j_job_applications(application_type, application_url, application_email)
        `)
        .eq('status', 'published')
        .order('posted_at', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;

      return (data || []).map((row: any) => {
        const locations = (row.j_job_locations_map || []).map((m: any) => ({
          city: m.j_cities?.name,
          state: m.j_cities?.j_states?.name,
          country: m.j_cities?.j_countries?.name,
        }));
        const skills = (row.j_job_skills_map || []).map((m: any) => m.j_skills?.name).filter(Boolean);
        const domains = (row.j_job_domains_map || []).map((m: any) => m.j_domains?.name).filter(Boolean);
        const salary = formatSalaryLPA(row.salary_min, row.salary_max);
        const postedTime = row.posted_at
          ? formatDistanceToNow(new Date(row.posted_at), { addSuffix: true }).replace(/^(less than |about |over |almost )/i, '')
          : 'Recently';
        const expLabel = row.experience_level
          ? toTitleCase(row.experience_level)
          : row.experience_min != null ? `${row.experience_min}-${row.experience_max || '?'} yrs` : '';
        const typeLabel = toTitleCase(row.job_type || 'full_time');
        const workModeLabel = row.work_mode ? toTitleCase(row.work_mode) : '';
        const application = row.j_job_applications?.[0];
        return {
          id: row.id,
          title: row.title,
          company: row.j_companies?.name || 'Unknown',
          companyLogo: row.j_companies?.logo_url || undefined,
          location: locations.map((l: any) => l.city).filter(Boolean).join(', '),
          locations,
          salary,
          salary_min: row.salary_min,
          salary_max: row.salary_max,
          type: typeLabel,
          experience: expLabel,
          skills,
          domains,
          postedTime,
          description: '',
          remote: row.work_mode === 'remote',
          work_mode: workModeLabel,
          applicationEmail: application?.application_email || undefined,
          applicationLink: application?.application_url || undefined,
        } as Job;
      });
    },
});

export const useRecentJobs = (limit = 10) => {
  return useQuery(recentJobsQueryOptions(limit));
};
