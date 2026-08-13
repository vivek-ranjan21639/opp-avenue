import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Job } from '@/components/JobCard';
import { formatDistanceToNow } from 'date-fns';
import { formatSalaryLPA, toTitleCase } from '@/lib/salary';
import { formatExperience } from '@/lib/mapJob';

const mapJobRow = (row: any): Job => {
  const locations = (row.j_job_locations_map || []).map((m: any) => ({
    city: m.j_cities?.name,
    state: m.j_cities?.j_states?.name,
    country: m.j_cities?.j_countries?.name,
  }));

  const primaryLocation = locations.length > 0
    ? locations.map((l: any) => l.city).filter(Boolean).join(', ')
    : 'Not specified';

  const salary = formatSalaryLPA(row.salary_min, row.salary_max);

  const skills = (row.j_job_skills_map || []).map((m: any) => m.j_skills?.name).filter(Boolean);
  const domains = (row.j_job_domains_map || []).map((m: any) => m.j_domains?.name).filter(Boolean);

  const postedTime = row.posted_at
    ? formatDistanceToNow(new Date(row.posted_at), { addSuffix: true }).replace(/^(less than |about |over |almost )/i, '')
    : 'Recently';

  const expLabel = formatExperience(row.experience_min, row.experience_max, row.experience_level);

  const typeLabel = toTitleCase(row.job_type || 'full_time');
  const workModeLabel = row.work_mode ? toTitleCase(row.work_mode) : '';

  const application = row.j_job_applications?.[0];

  return {
    id: row.id,
    title: row.title,
    company: row.j_companies?.name || 'Unknown',
    companyLogo: row.j_companies?.logo_url || undefined,
    location: primaryLocation,
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
  };
};

export const jobsQueryKey = ['jobs'] as const;

export const fetchJobs = async (): Promise<Job[]> => {
  // Only select columns the JobCard actually uses - avoids downloading
  // the full HTML description for hundreds of rows on every home load.
  const { data, error } = await supabase
    .from('j_jobs')
    .select(`
      id, title, salary_min, salary_max, posted_at,
      experience_level, experience_min, experience_max,
      job_type, work_mode,
      j_companies(id, name, logo_url),
      j_job_skills_map(j_skills(name)),
      j_job_domains_map(j_domains(name)),
      j_job_locations_map(j_cities(name, j_states(name), j_countries(name))),
      j_job_applications(application_url, application_email)
    `)
    .eq('status', 'published')
    .order('posted_at', { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data || []).map(mapJobRow);
};

export const jobsQueryOptions = () => ({
  queryKey: jobsQueryKey,
  queryFn: fetchJobs,
});

export const useJobs = () => {
  return useQuery(jobsQueryOptions());
};

export const jobQueryKey = (jobId: string | undefined) => ['job', jobId] as const;

export const fetchJob = async (jobId: string | undefined): Promise<any> => {
  if (!jobId) return null;
  const { data: row, error } = await supabase
    .from('j_jobs')
    .select(`
      *,
      j_companies(id, name, logo_url, slug, website, description, employee_count, founding_year, headquarter),
      j_job_skills_map(j_skills(id, name)),
      j_job_domains_map(j_domains(id, name)),
      j_job_locations_map(j_cities(id, name, j_states(name), j_countries(name))),
      j_job_applications(application_type, application_url, application_email),
      j_job_seo(*)
    `)
    .eq('id', jobId)
    .single();

  if (error || !row) return null;

  const locations = (row.j_job_locations_map || []).map((m: any) => ({
    city: m.j_cities?.name,
    state: m.j_cities?.j_states?.name,
    country: m.j_cities?.j_countries?.name,
  }));

  const skills = (row.j_job_skills_map || []).map((m: any) => m.j_skills?.name).filter(Boolean);
  const domains = (row.j_job_domains_map || []).map((m: any) => m.j_domains?.name).filter(Boolean);

  const salary = formatSalaryLPA(row.salary_min, row.salary_max);

  const typeLabel = toTitleCase(row.job_type || 'full_time');
  const workModeLabel = row.work_mode ? toTitleCase(row.work_mode) : '';
  const expLabel = formatExperience(row.experience_min, row.experience_max, row.experience_level);

  const postedTime = row.posted_at
    ? formatDistanceToNow(new Date(row.posted_at), { addSuffix: true }).replace(/^(less than |about |over |almost )/i, '')
    : 'Recently';

  const application = (row.j_job_applications as any[])?.[0];

  return {
    id: row.id,
    title: row.title,
    company_name: row.j_companies?.name || 'Unknown',
    companyLogo: row.j_companies?.logo_url || undefined,
    companyWebsite: row.j_companies?.website || undefined,
    companyDescription: row.j_companies?.description || undefined,
    companyEmployeeCount: row.j_companies?.employee_count || undefined,
    companyFoundedYear: row.j_companies?.founding_year || undefined,
    companyHqLocation: row.j_companies?.headquarter || undefined,
    location: locations.map((l: any) => l.city).filter(Boolean).join(', ') || 'Not specified',
    locations,
    salary,
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    currency: row.salary_currency || 'INR',
    type: typeLabel,
    experience: expLabel,
    work_mode: workModeLabel,
    skills,
    domains,
    postedTime,
    description: (row as any).description || '',
    applicationEmail: application?.application_email || undefined,
    applicationLink: application?.application_url || undefined,
    jd_file_url: row.jd_pdf_url || undefined,
    created_at: row.created_at,
    deadline: row.expires_at,
    posted_at: row.posted_at,
    status: row.status,
  };
};

export const jobQueryOptions = (jobId: string | undefined) => ({
  queryKey: jobQueryKey(jobId),
  queryFn: () => fetchJob(jobId),
});

// Returns a mapped Job-like object for the detail page
export const useJob = (jobId: string | undefined) => {
  return useQuery({
    ...jobQueryOptions(jobId),
    enabled: !!jobId,
  });
};
