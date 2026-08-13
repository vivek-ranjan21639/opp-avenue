import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapRowToJob } from "@/lib/mapJob";
import type { Job } from "@/components/JobCard";

export type DisplayLocation = 'home' | 'job_detail';
export type ContentType = 'poster_clickable' | 'poster_static' | 'poster_job_link' | 'job_card';

export interface FeaturedContent {
  id: string;
  content_type: ContentType;
  job_id?: string | null;
  title?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  display_location: DisplayLocation;
  display_order: number;
  is_active: boolean;
  // Hydrated when content_type === 'job_card' — full Job mapped from j_jobs row
  job?: Job | null;
}

export const fetchFeaturedContent = async (displayLocation: DisplayLocation): Promise<FeaturedContent[]> => {
  const { data, error } = await supabase
    .from('j_featured')
    .select(`
      id,
      content_type,
      job_id,
      title,
      image_url,
      link_url,
      display_location,
      display_order,
      is_active,
      job:j_jobs!j_featured_job_id_fkey(
        id, title, salary_min, salary_max, posted_at,
        experience_level, experience_min, experience_max,
        job_type, work_mode,
        j_companies(id, name, logo_url),
        j_job_skills_map(j_skills(name)),
        j_job_domains_map(j_domains(name)),
        j_job_locations_map(j_cities(name, j_states(name), j_countries(name))),
        j_job_applications(application_url, application_email)
      )
    `)
    .eq('display_location', displayLocation)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('useFeaturedContent error:', error);
    return [];
  }
  return ((data || []) as any[]).map((row) => ({
    ...row,
    job: row.job ? mapRowToJob(row.job) : null,
  })) as FeaturedContent[];
};

export const featuredContentQueryOptions = (displayLocation: DisplayLocation) => ({
  queryKey: ['featured-content', displayLocation] as const,
  queryFn: () => fetchFeaturedContent(displayLocation),
});

export const useFeaturedContent = (displayLocation: DisplayLocation, options?: { enabled?: boolean }) => {
  return useQuery({
    ...featuredContentQueryOptions(displayLocation),
    enabled: options?.enabled ?? true,
  });
};
