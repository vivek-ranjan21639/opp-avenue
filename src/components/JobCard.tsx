import React from 'react';
import { MapPin, Building, Briefcase, Laptop } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  experience: string;
  skills: string[];
  postedTime: string;
  description: string;
  remote: boolean;
  companyLogo?: string;
  sector?: string;
  domains?: string[];
  applicationEmail?: string;
  applicationLink?: string;
  locations?: any[];
  work_mode?: string;
  vacancies?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
}

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const cityLabel = (() => {
    const cities = (job.locations || []).map((l: any) => l?.city).filter(Boolean);
    if (cities.length === 0) return job.location || 'NA';
    if (cities.length === 1) return cities[0];
    return `${cities[0]} +${cities.length - 1}`;
  })();

  return (
    <div className="job-card cursor-pointer" onClick={() => onClick(job)}>
      {/* Header: logo + company + role */}
      <div className="flex items-center gap-3">
        {job.companyLogo ? (
          <img
            src={job.companyLogo}
            alt={`${job.company} logo`}
            className="w-10 h-10 rounded-lg object-cover shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold">
              {job.company.charAt(0)}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-card-foreground truncate leading-tight">
            {job.title}
          </h3>
          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
            <Building className="w-3 h-3 shrink-0" />
            <span className="text-xs truncate">{job.company}</span>
          </div>
        </div>
      </div>

      {/* Meta row: job type, work mode, location */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          {job.type || 'NA'}
        </Badge>
        <Badge variant="secondary" className="text-xs flex items-center gap-1">
          <Laptop className="w-3 h-3" />
          {job.work_mode || 'NA'}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{cityLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
