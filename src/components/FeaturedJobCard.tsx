import React from 'react';
import { MapPin, Building, Briefcase, Laptop, IndianRupee, Clock, GraduationCap, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Job } from '@/components/JobCard';

interface Props {
  job: Job;
  onClick?: (job: Job, event: React.MouseEvent<HTMLAnchorElement>) => void;
  href?: string;
  target?: React.HTMLAttributeAnchorTarget;
}

const FeaturedJobCard: React.FC<Props> = ({
  job,
  onClick,
  href,
  target = '_blank',
}) => {
  const cityLabel = (() => {
    const cities = (job.locations || []).map((l: any) => l?.city).filter(Boolean);
    if (cities.length === 0) return job.location || 'NA';
    if (cities.length === 1) return cities[0];
    return `${cities[0]} +${cities.length - 1}`;
  })();

  const skills = (job.skills || []).slice(0, 4);
  const domainLabel = (() => {
    const ds = (job.domains || []).filter(Boolean);
    if (ds.length === 0) return job.sector || 'NA';
    if (ds.length === 1) return ds[0];
    return `${ds[0]} +${ds.length - 1}`;
  })();

  return (
    <a
      href={href || `/job/${job.id}`}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      onClick={(event) => onClick?.(job, event)}
      className="cursor-pointer h-[300px] w-[300px] rounded-xl p-3.5 flex flex-col gap-2 text-white no-underline transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'linear-gradient(135deg, hsl(215 90% 50%), hsl(220 85% 42%))',
        border: '1px solid hsl(220 85% 38%)',
        boxShadow: '0 8px 30px hsl(220 85% 35% / 0.35)',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {job.companyLogo ? (
          <img
            src={job.companyLogo}
            alt={`${job.company} logo`}
            className="w-12 h-12 rounded-lg object-cover shrink-0 bg-white/10"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <span className="font-bold text-lg">{job.company.charAt(0)}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-tight line-clamp-2">{job.title}</h3>
          <div className="flex items-center gap-1 mt-1 text-white/85">
            <Building className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs truncate">{job.company}</span>
          </div>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-2 text-xs text-white/90 mt-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{cityLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <IndianRupee className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{job.salary || 'NA'}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <Briefcase className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{job.type || 'NA'}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <Laptop className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{job.work_mode || 'NA'}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0 col-span-2">
          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{job.experience || 'NA'}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0 col-span-2">
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{domainLabel}</span>
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className="text-[11px] bg-white/15 text-white border-white/25 hover:bg-white/25"
            >
              {s}
            </Badge>
          ))}
        </div>
      )}

      {/* Description */}
      {job.description && (
        <p className="text-xs text-white/85 line-clamp-3 flex-1">{job.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1 text-[11px] text-white/80 mt-auto pt-2 border-t border-white/15">
        <Clock className="w-3 h-3" />
        <span>{job.postedTime || 'NA'}</span>
      </div>
    </a>
  );
};

export default FeaturedJobCard;
