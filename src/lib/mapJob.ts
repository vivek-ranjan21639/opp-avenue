import { formatDistanceToNow } from "date-fns";
import type { Job } from "@/components/JobCard";
import { formatSalaryLPA, toTitleCase } from "@/lib/salary";

export function formatExperience(min: number | null | undefined, max: number | null | undefined, level?: string | null): string {
  const hasMin = min != null && !Number.isNaN(Number(min));
  const hasMax = max != null && !Number.isNaN(Number(max));
  if (hasMin && hasMax) return `${min}-${max} yrs`;
  if (hasMin && !hasMax) return `${min}+ yrs`;
  if (!hasMin && hasMax) return `Upto ${max} yrs`;
  if (level) return toTitleCase(level);
  return '';
}

export function mapRowToJob(row: any): Job {
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
  const expLabel = formatExperience(row.experience_min, row.experience_max, row.experience_level);
  const typeLabel = row.job_type ? toTitleCase(row.job_type) : '';
  const workModeLabel = row.work_mode ? toTitleCase(row.work_mode) : '';
  const application = row.j_job_applications?.[0];
  return {
    id: row.id,
    title: row.title,
    company: row.j_companies?.name || row.company?.name || 'Unknown',
    companyLogo: row.j_companies?.logo_url || row.company?.logo_url || undefined,
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
}
