import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, MapPin, Briefcase, GraduationCap, IndianRupee, Building, Users, Home, Linkedin, MessageCircle, Phone, Mail, X, Menu, Code, Layers, Building2, Award, DollarSign, Youtube } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation } from 'react-router-dom';
import type { Job } from '@/components/JobCard';
import oppAvenueLogo from '@/assets/opp-avenue-logo.png';
import {
  SALARY_BUCKETS,
  jobMatchesSalaryBucket,
  JOB_TYPE_OPTIONS,
  WORK_MODE_OPTIONS,
  EXPERIENCE_OPTIONS,
} from '@/lib/salary';
import { useSiteSetting, type SocialLinks, type ContactInfo, type SocialVisibility } from '@/hooks/useSiteSettings';
import SocialIcon from '@/components/SocialIcon';

const normalizeSocial = (key: keyof SocialLinks, raw?: string) => {
  if (!raw) return '';
  const v = raw.trim();
  if (!v) return '';
  if (key === 'phone') return v.replace(/^tel:\s*/i, 'tel:').replace(/\s+/g, '');
  if (key === 'email') return v.replace(/^mailto:\s*/i, 'mailto:').replace(/\s+/g, '');
  return v;
};

// Special sentinel value stored in a filter's array to mean
// "exclude jobs with no value for this field" (default is to include them).
export const UNSPECIFIED = '__unspecified__';
export const EXCLUDE_UNSPECIFIED = '__exclude_unspecified__';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onAdvertiseClick: () => void;
  onSearchChange: (query: string) => void;
  onFiltersChange: (filters: FilterState) => void;
  searchQuery: string;
  activeFilters: FilterState;
  jobs?: Job[];
}

export interface FilterState {
  location: string[];
  jobType: string[];
  experience: string[];
  salaryRange: string[];
  domain: string[];
  skills: string[];
  companies: string[];
  workMode: string[];
}

const Header: React.FC<HeaderProps> = ({
  onSearchChange, 
  onFiltersChange, 
  searchQuery, 
  activeFilters,
  jobs = [],
}) => {
  const [showFilters, setShowFilters] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [manualToggle, setManualToggle] = useState(false);
  const [filterSearchQueries, setFilterSearchQueries] = useState<Record<string, string>>({});
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const allJobs = isHomePage ? jobs : [];

  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const y = window.scrollY;
        // Mobile uses a much wider hysteresis window because the URL bar
        // show/hide and momentum-scroll bounce cause scrollY to oscillate
        // around the threshold, which would otherwise toggle the filter
        // panel rapidly and flicker.
        const isMobile = window.innerWidth < 768;
        const enterAt = isMobile ? 320 : 180;
        const exitAt = isMobile ? 80 : 120;
        setIsScrolled(prev => {
          const next = prev ? y > exitAt : y > enterAt;
          if (next !== prev && !manualToggle) {
            // Auto-collapse the filter panel once scrolled — the filter icon
            // (which only appears when scrolled) lets the user reopen it.
            setShowFilters(!next);
          }
          if (!next && manualToggle) {
            setManualToggle(false);
          }
          return next;
        });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [manualToggle]);

  const handleFilterToggle = () => {
    setManualToggle(true);
    setShowFilters(prev => !prev);
  };

  const { value: socialLinksConfig } = useSiteSetting<SocialLinks>('social_links', {});
  const { value: contactInfo } = useSiteSetting<ContactInfo>('contact_info', { email: '', phone: '' });
  const { value: socialVisibility } = useSiteSetting<SocialVisibility>('social_visibility', {});
  const socialLinks = [
    { kind: 'linkedin' as const, icon: Linkedin, href: normalizeSocial('linkedin', socialLinksConfig.linkedin), label: 'LinkedIn', color: 'text-blue-600' },
    { kind: 'youtube' as const, icon: Youtube, href: normalizeSocial('youtube', socialLinksConfig.youtube), label: 'YouTube', color: 'text-red-600' },
    { kind: 'whatsapp' as const, icon: MessageCircle, href: normalizeSocial('whatsapp', socialLinksConfig.whatsapp), label: 'WhatsApp', color: 'text-green-600' },
    { kind: 'phone' as const, icon: Phone, href: normalizeSocial('phone', socialLinksConfig.phone), label: 'Call Us', color: 'text-purple-600' },
    { kind: 'email' as const, icon: Mail, href: normalizeSocial('email', socialLinksConfig.email), label: 'Email', color: 'text-red-500' },
  ].filter((l) => {
    if (socialVisibility?.[l.kind] !== true) return false;
    if (l.kind === 'phone') return !!contactInfo.phone;
    if (l.kind === 'email') return !!contactInfo.email;
    return l.href.length > 0;
  });

  // Get dynamic filter options based on current selections and available jobs
  const filterOptions = useMemo(() => {
    const getDynamicFilterOptions = () => {
    // Get all jobs that match current filters (excluding the filter we're calculating options for)
    const getFilteredJobsExcluding = (excludeFilter: keyof FilterState) => {
      let filtered = [...allJobs];

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(job =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.skills.some(skill => skill.toLowerCase().includes(query))
        );
      }

      Object.entries(activeFilters).forEach(([key, values]) => {
        if (key === excludeFilter || !values || values.length === 0) return;

        const filterKey = key as keyof FilterState;
        const excludeUnspec = (values as string[]).includes(EXCLUDE_UNSPECIFIED);
        const realValues = (values as string[]).filter(v => v !== EXCLUDE_UNSPECIFIED && v !== UNSPECIFIED);
        if (realValues.length === 0 && !excludeUnspec) return;

        const matches = (predicate: (j: Job) => boolean, isUnspec: (j: Job) => boolean) => {
          filtered = filtered.filter(j => {
            if (isUnspec(j)) return !excludeUnspec;
            return realValues.length === 0 ? true : predicate(j);
          });
        };

        if (filterKey === 'location') {
          matches(
            (job) => realValues.some(fl => (job.locations || []).some((loc: any) =>
              loc.city?.toLowerCase().includes(fl.toLowerCase()) ||
              loc.state?.toLowerCase().includes(fl.toLowerCase())
            ) || job.location.toLowerCase().includes(fl.toLowerCase())),
            (job) => !job.locations || job.locations.length === 0 || !job.locations.some((l: any) => l?.city)
          );
        } else if (filterKey === 'workMode') {
          matches(
            (job) => realValues.includes(job.work_mode || ''),
            (job) => !job.work_mode
          );
        } else if (filterKey === 'jobType') {
          matches(
            (job) => realValues.includes(job.type),
            (job) => !job.type
          );
        } else if (filterKey === 'experience') {
          matches(
            (job) => realValues.includes(job.experience),
            (job) => !job.experience
          );
        } else if (filterKey === 'salaryRange') {
          matches(
            (job) => realValues.some(r => jobMatchesSalaryBucket(job.salary_min, job.salary_max, r)),
            (job) => job.salary_min == null && job.salary_max == null
          );
        } else if (filterKey === 'companies') {
          matches(
            (job) => realValues.includes(job.company),
            (job) => !job.company
          );
        } else if (filterKey === 'domain') {
          matches(
            (job) => !!(job.domains && job.domains.some(d => realValues.includes(d))),
            (job) => !job.domains || job.domains.length === 0
          );
        } else if (filterKey === 'skills') {
          matches(
            (job) => job.skills.some(s => realValues.includes(s)),
            (job) => !job.skills || job.skills.length === 0
          );
        }
      });

      return filtered;
    };

    const locationJobs = getFilteredJobsExcluding('location');
    const allCities = new Set<string>();
    locationJobs.forEach(job => {
      if (job.locations && Array.isArray(job.locations)) {
        job.locations.forEach((loc: any) => { if (loc.city) allCities.add(loc.city); });
      }
    });
    const locationOptions = Array.from(allCities).sort();

    const companyJobs = getFilteredJobsExcluding('companies');
    const companyOptions = Array.from(new Set(companyJobs.map(job => job.company).filter(Boolean))).sort();

    const domainJobs = getFilteredJobsExcluding('domain');
    const domainOptions = Array.from(new Set(domainJobs.flatMap(job => job.domains || []))).sort();

    const skillsJobs = getFilteredJobsExcluding('skills');
    const skillsOptions = Array.from(new Set(skillsJobs.flatMap(job => job.skills))).sort();

    return [
      { icon: MapPin, label: 'Location', key: 'location' as keyof FilterState, options: locationOptions, allowUnspecified: true },
      { icon: Briefcase, label: 'Job Type', key: 'jobType' as keyof FilterState, options: JOB_TYPE_OPTIONS, allowUnspecified: true },
      { icon: Building2, label: 'Work Mode', key: 'workMode' as keyof FilterState, options: WORK_MODE_OPTIONS, allowUnspecified: true },
      { icon: GraduationCap, label: 'Experience', key: 'experience' as keyof FilterState, options: EXPERIENCE_OPTIONS, allowUnspecified: true },
      { icon: IndianRupee, label: 'Salary', key: 'salaryRange' as keyof FilterState, options: SALARY_BUCKETS.map(b => b.label), allowUnspecified: true },
      { icon: Layers, label: 'Domain', key: 'domain' as keyof FilterState, options: domainOptions, allowUnspecified: true },
      { icon: Code, label: 'Skills', key: 'skills' as keyof FilterState, options: skillsOptions, allowUnspecified: true },
      { icon: Users, label: 'Companies', key: 'companies' as keyof FilterState, options: companyOptions, allowUnspecified: true },
    ];
    };

    if (!isHomePage || allJobs.length === 0) return [];
    return getDynamicFilterOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allJobs, searchQuery, activeFilters, isHomePage]);

  const clearFilterSearchQuery = useCallback((filterKey: keyof FilterState) => {
    setFilterSearchQueries(prev => {
      if (!prev[filterKey]) return prev;
      const next = { ...prev };
      delete next[filterKey];
      return next;
    });
  }, []);

  const handleFilterChange = (filterKey: keyof FilterState, option: string) => {
    const currentValues = activeFilters[filterKey];
    const newValues = currentValues.includes(option)
      ? currentValues.filter(item => item !== option)
      : [...currentValues, option];
    
    const newFilters = {
      ...activeFilters,
      [filterKey]: newValues
    };
    
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters: FilterState = {
      location: [],
      jobType: [],
      experience: [],
      salaryRange: [],
      domain: [],
      skills: [],
      companies: [],
      workMode: []
    };
    onFiltersChange(emptyFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, filters) => count + filters.length, 0);
  };

  const renderFilterDropdownContent = (filter: typeof filterOptions[0], textSize: string = 'text-xs') => {
    const searchQuery = filterSearchQueries[filter.key] || '';
    const filteredOptions = searchQuery
      ? filter.options.filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()))
      : filter.options;
    const unspecChecked = activeFilters[filter.key].includes(EXCLUDE_UNSPECIFIED);

    return (
      <>
        {filter.options.length > 5 && (
          <div className="p-2 border-b border-border sticky top-0 bg-card z-10">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Search ${filter.label.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => {
                  e.stopPropagation();
                  setFilterSearchQueries(prev => ({ ...prev, [filter.key]: e.target.value }));
                }}
                onKeyDown={(e) => e.stopPropagation()}
                className={`w-full pl-7 pr-2 py-1.5 ${textSize} rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary`}
              />
            </div>
          </div>
        )}
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={activeFilters[filter.key].includes(option)}
              onCheckedChange={() => handleFilterChange(filter.key, option)}
              onSelect={(e) => e.preventDefault()}
              className={textSize}
            >
              {option}
            </DropdownMenuCheckboxItem>
          ))
        ) : (
          <div className={`px-2 py-2 ${textSize} text-muted-foreground`}>
            {searchQuery ? 'No matches found' : 'No options available'}
          </div>
        )}
        {filter.allowUnspecified && !searchQuery && (
          <>
            <div className="border-t border-border my-1" />
            <DropdownMenuCheckboxItem
              checked={unspecChecked}
              onCheckedChange={() => handleFilterChange(filter.key, EXCLUDE_UNSPECIFIED)}
              onSelect={(e) => e.preventDefault()}
              className={`${textSize} italic`}
            >
              Exclude Not Specified
            </DropdownMenuCheckboxItem>
          </>
        )}
      </>
    );
  };

  return (
    <header className="sticky-header border-none">
      {/* Mobile Top Bar: Logo left, Social icons center, Advertise right */}
      <div className="flex md:hidden items-center justify-between px-4 py-2 border-b border-border/20">
        <Link to="/" aria-label="Go to home" className="flex-shrink-0">
          <img src={oppAvenueLogo} alt="Opp Avenue Logo" className="w-14 h-14 rounded-lg object-cover" />
        </Link>
        <div className="flex items-center gap-2">
          {socialLinks.map((link, index) => (
            <SocialIcon
              key={index}
              link={link}
              wrapperClassName="flex items-center justify-center w-7 h-7 rounded-full bg-card hover:bg-primary hover:scale-110 transition-all duration-200 shadow-sm border border-border/50"
              iconClassName="w-3.5 h-3.5"
            />
          ))}
        </div>
        <Link to="/advertise" className="text-xs font-medium px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent hover:text-accent-foreground transition-all flex-shrink-0">Advertise</Link>
      </div>

      {/* Mobile Navigation - Plain text links (without Advertise) */}
      <div className="flex md:hidden items-center justify-center gap-4 py-1.5 border-b border-border/20 px-4">
        <Link to="/" className={`text-xs font-medium transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Home</Link>
        <Link to="/resources" className={`text-xs font-medium transition-colors ${location.pathname.startsWith('/resources') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Resources</Link>
        <Link to="/blogs" className={`text-xs font-medium transition-colors ${location.pathname.startsWith('/blog') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Lighthouse</Link>
        <Link to="/about" className={`text-xs font-medium transition-colors ${location.pathname === '/about' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>About</Link>
      </div>

      {/* Tablet: Two rows (top bar + nav row) */}
      <div className="hidden md:flex lg:hidden items-center justify-between max-w-7xl mx-auto px-8 py-3 border-b border-border/20">
        <Link to="/" aria-label="Go to home" className="flex-shrink-0">
          <img src={oppAvenueLogo} alt="Opp Avenue Logo" className="w-14 h-14 rounded-lg object-cover" />
        </Link>
        <div className="flex items-center gap-2">
          {socialLinks.map((link, index) => (
            <SocialIcon
              key={index}
              link={link}
              wrapperClassName="flex items-center justify-center w-8 h-8 rounded-full bg-card hover:bg-primary hover:scale-110 transition-all duration-200 shadow-sm border border-border/50"
              iconClassName="w-4 h-4"
            />
          ))}
        </div>
        <Link to="/advertise" className="text-sm font-medium px-4 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent hover:text-accent-foreground transition-all flex-shrink-0">Advertise</Link>
      </div>
      <div className="hidden md:flex lg:hidden items-center justify-between max-w-7xl mx-auto px-8 py-2 border-b border-border/20">
        {isHomePage && (
          <div className={`relative flex items-center gap-3 ${isScrolled ? 'flex-1 max-w-md' : 'flex-1 max-w-sm'}`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input type="text" placeholder="Search for jobs, companies, or skills..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10 h-9 text-sm bg-card border-input-border focus:border-primary focus:ring-primary rounded-xl" />
            </div>
            {isScrolled && (
              <Button onClick={handleFilterToggle} variant="outline" size="sm" className="h-8 w-8 rounded-xl border-input-border hover:bg-primary hover:text-primary-foreground hover:border-primary flex-shrink-0">
                <Filter className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
        {!isHomePage && <div />}
        <div className="flex items-center gap-5">
          <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Home</Link>
          <Link to="/resources" className={`text-sm font-medium transition-colors ${location.pathname.startsWith('/resources') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Resources</Link>
          <Link to="/blogs" className={`text-sm font-medium transition-colors ${location.pathname.startsWith('/blog') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Lighthouse</Link>
          <Link to="/about" className={`text-sm font-medium transition-colors ${location.pathname === '/about' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>About</Link>
        </div>
      </div>

      {/* Laptop/Desktop: Single row - Logo | Search | Nav | Social | Advertise */}
      <div className="hidden lg:flex items-center justify-between max-w-7xl mx-auto px-16 py-3 border-b border-border/20 gap-6">
        <Link to="/" aria-label="Go to home" className="flex-shrink-0">
          <img src={oppAvenueLogo} alt="Opp Avenue Logo" className="w-16 h-16 rounded-lg object-cover" />
        </Link>
        {isHomePage && (
          <div className={`relative flex items-center gap-3 ${isScrolled ? 'flex-1 max-w-md' : 'flex-1 max-w-sm'}`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input type="text" placeholder="Search jobs, companies, skills..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10 h-9 text-sm bg-card border-input-border focus:border-primary focus:ring-primary rounded-xl" />
            </div>
            {isScrolled && (
              <Button onClick={handleFilterToggle} variant="outline" size="sm" className="h-8 w-8 rounded-xl border-input-border hover:bg-primary hover:text-primary-foreground hover:border-primary flex-shrink-0">
                <Filter className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
        <div className="flex items-center gap-6">
          <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Home</Link>
          <Link to="/resources" className={`text-sm font-medium transition-colors ${location.pathname.startsWith('/resources') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Resources</Link>
          <Link to="/blogs" className={`text-sm font-medium transition-colors ${location.pathname.startsWith('/blog') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Lighthouse</Link>
          <Link to="/about" className={`text-sm font-medium transition-colors ${location.pathname === '/about' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>About</Link>
        </div>
        <div className="flex items-center gap-2">
          {socialLinks.map((link, index) => (
            <SocialIcon
              key={index}
              link={link}
              wrapperClassName="flex items-center justify-center w-8 h-8 rounded-full bg-card hover:bg-primary hover:scale-110 transition-all duration-200 shadow-sm border border-border/50"
              iconClassName="w-4 h-4"
            />
          ))}
        </div>
        <Link to="/advertise" className="text-sm font-medium px-4 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent hover:text-accent-foreground transition-all flex-shrink-0">Advertise</Link>
      </div>

      <div className="px-4 py-2">
        {/* Mobile Search Bar - Below Title (Home Page Only) */}
        {isHomePage && (
          <div className="flex md:hidden items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search for jobs, companies, or skills..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-10 text-sm bg-card border-input-border focus:border-primary focus:ring-primary rounded-xl"
              />
            </div>
            {isScrolled && (
              <Button
                onClick={handleFilterToggle}
                variant="outline"
                size="sm"
                className="h-10 w-10 rounded-xl border-input-border hover:bg-secondary hover:border-primary flex-shrink-0"
              >
                <Filter className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}


        {/* Filters Section for Home Page - smooth collapse to prevent flicker */}
        {isHomePage && (
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
              showFilters ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
            aria-hidden={!showFilters}
          >
            <div className="overflow-hidden">
          <div className="border-t border-border bg-background py-2 md:-mx-4 md:px-2 overflow-x-hidden">
            {/* Mobile Filters - 3 rows */}
            <div className="md:hidden space-y-1.5">
              <div className="grid grid-cols-3 gap-1">
                {filterOptions.slice(0, 3).map((filter) => (
                  <DropdownMenu key={filter.key}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 px-1 text-[10px] min-w-0 hover:bg-secondary hover:border-primary hover:text-foreground ${
                          activeFilters[filter.key].length > 0 
                            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground' 
                            : 'border-input-border'
                        }`}
                      >
                        <filter.icon className="w-3 h-3 mr-0.5 flex-shrink-0" />
                        <span className="truncate">{filter.label}</span>
                        {activeFilters[filter.key].length > 0 && (
                          <Badge variant="secondary" className="ml-0.5 h-3 w-3 p-0 text-[8px] flex-shrink-0">
                            {activeFilters[filter.key].length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 max-h-60 overflow-y-auto bg-card" align="center"
                      onCloseAutoFocus={() => clearFilterSearchQuery(filter.key)}
                    >
                      {renderFilterDropdownContent(filter, 'text-xs')}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {filterOptions.slice(3, 6).map((filter) => (
                  <DropdownMenu key={filter.key}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 px-1 text-[10px] min-w-0 hover:bg-secondary hover:border-primary hover:text-foreground ${
                          activeFilters[filter.key].length > 0 
                            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground' 
                            : 'border-input-border'
                        }`}
                      >
                        <filter.icon className="w-3 h-3 mr-0.5 flex-shrink-0" />
                        <span className="truncate">{filter.label}</span>
                        {activeFilters[filter.key].length > 0 && (
                          <Badge variant="secondary" className="ml-0.5 h-3 w-3 p-0 text-[8px] flex-shrink-0">
                            {activeFilters[filter.key].length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 max-h-60 overflow-y-auto bg-card" align="center"
                      onCloseAutoFocus={() => clearFilterSearchQuery(filter.key)}
                    >
                      {renderFilterDropdownContent(filter, 'text-xs')}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {filterOptions.slice(6).map((filter) => (
                  <DropdownMenu key={filter.key}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 px-1.5 text-[10px] min-w-0 hover:bg-secondary hover:border-primary hover:text-foreground ${
                          activeFilters[filter.key].length > 0 
                            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground' 
                            : 'border-input-border'
                        }`}
                      >
                        <filter.icon className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{filter.label}</span>
                        {activeFilters[filter.key].length > 0 && (
                          <Badge variant="secondary" className="ml-1 h-3 w-3 p-0 text-[8px] flex-shrink-0">
                            {activeFilters[filter.key].length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 max-h-60 overflow-y-auto bg-card" align="center"
                      onCloseAutoFocus={() => clearFilterSearchQuery(filter.key)}
                    >
                      {renderFilterDropdownContent(filter, 'text-xs')}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </div>
              {getActiveFilterCount() > 0 && (
                <div className="flex justify-center">
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px] border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              )}
            </div>

            {/* Tablet Filters - Single row */}
            <div className="hidden md:block lg:hidden">
              <div className="grid grid-cols-8 gap-1 px-2">
                {filterOptions.map((filter) => (
                  <DropdownMenu key={filter.key}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 px-1 text-[10px] hover:bg-secondary hover:border-primary hover:text-foreground ${
                          activeFilters[filter.key].length > 0 
                            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground' 
                            : 'border-input-border'
                        }`}
                      >
                        <filter.icon className="w-3 h-3 mr-0.5" />
                        <span className="truncate">{filter.label}</span>
                        {activeFilters[filter.key].length > 0 && (
                          <Badge variant="secondary" className="ml-0.5 h-3 w-3 p-0 text-[8px]">
                            {activeFilters[filter.key].length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-52 max-h-64 overflow-y-auto bg-card" align="center"
                      onCloseAutoFocus={() => clearFilterSearchQuery(filter.key)}
                    >
                      {renderFilterDropdownContent(filter, 'text-sm')}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </div>
              {getActiveFilterCount() > 0 && (
                <div className="flex justify-center mt-2">
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-xs border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              )}
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:block max-w-7xl mx-auto px-4">
              <div className="flex flex-wrap gap-2 items-center justify-center">
                {filterOptions.map((filter, index) => (
                  <DropdownMenu key={index}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 px-3 rounded-full border-input-border text-xs hover:bg-secondary hover:border-primary hover:text-foreground ${
                          activeFilters[filter.key].length > 0 
                            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground' 
                            : 'text-muted-foreground'
                        }`}
                      >
                        <filter.icon className="w-3 h-3 mr-1" />
                        {filter.label}
                        {activeFilters[filter.key].length > 0 && (
                          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                            {activeFilters[filter.key].length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto bg-card border-border shadow-lg" align="center"
                      onCloseAutoFocus={() => clearFilterSearchQuery(filter.key)}
                    >
                      {renderFilterDropdownContent(filter, 'text-sm')}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
                
                {getActiveFilterCount() > 0 && (
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-full border-input-border hover:bg-destructive hover:text-destructive-foreground text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              
              {/* Active Filter Tags */}
              {getActiveFilterCount() > 0 && (
                <div className="flex flex-wrap gap-1 items-center justify-center mt-2">
                  {Object.entries(activeFilters).map(([key, values]) =>
                    values.map((value) => (
                      <Badge
                        key={`${key}-${value}`}
                        variant="secondary"
                        className="text-xs px-2 py-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleFilterChange(key as keyof FilterState, value)}
                      >
                        {value === UNSPECIFIED ? 'Not Specified' : value}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))
                  )}
                </div>
              )}
            </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
