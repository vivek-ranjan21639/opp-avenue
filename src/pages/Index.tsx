
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import Header, { FilterState, UNSPECIFIED, EXCLUDE_UNSPECIFIED } from '@/components/Header';
import { jobMatchesSalaryBucket } from '@/lib/salary';
import JobCard, { Job } from '@/components/JobCard';
import AdUnit from '@/components/AdUnit';
import { Button } from '@/components/ui/button';
import { useJobs } from '@/hooks/useJobs';
import { useFeaturedContent } from '@/hooks/useFeaturedContent';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import SEO from '@/components/SEO';
import WebsiteSchema from '@/components/seo/WebsiteSchema';
import { usePrerenderReady } from '@/hooks/usePrerenderReady';
import NoticeBanner from '@/components/NoticeBanner';
import { trackEvent } from '@/lib/analytics';

const Index = () => {
  const navigate = useNavigate();
  const { data: allJobs = [], isLoading } = useJobs();
  const { data: featuredContent = [] } = useFeaturedContent('home');
  const [displayCount, setDisplayCount] = useState(15);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    location: [],
    jobType: [],
    experience: [],
    salaryRange: [],
    domain: [],
    skills: [],
    companies: [],
    workMode: []
  });

  // Signal prerenderer when jobs are loaded
  usePrerenderReady(!isLoading && allJobs.length > 0);
  const filteredJobs = useMemo(() => {
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
    
    // Apply location filter (works with multiple locations per job)
    const applyFilter = <T,>(
      values: string[],
      predicate: (job: Job, real: string[]) => boolean,
      isUnspec: (job: Job) => boolean,
    ) => {
      if (!values || values.length === 0) return;
      const excludeUnspec = values.includes(EXCLUDE_UNSPECIFIED);
      const real = values.filter(v => v !== EXCLUDE_UNSPECIFIED && v !== UNSPECIFIED);
      if (real.length === 0 && !excludeUnspec) return;
      filtered = filtered.filter(job => {
        if (isUnspec(job)) return !excludeUnspec;
        return real.length === 0 ? true : predicate(job, real);
      });
    };

    applyFilter(
      activeFilters.location,
      (job, real) => real.some(fl => {
        if (job.locations && Array.isArray(job.locations)) {
          return job.locations.some((loc: any) =>
            loc.city?.toLowerCase().includes(fl.toLowerCase()) ||
            loc.state?.toLowerCase().includes(fl.toLowerCase())
          );
        }
        return job.location.toLowerCase().includes(fl.toLowerCase());
      }),
      (job) => !job.locations || job.locations.length === 0 || !job.locations.some((l: any) => l?.city)
    );

    applyFilter(
      activeFilters.workMode,
      (job, real) => real.includes(job.work_mode || ''),
      (job) => !job.work_mode
    );

    applyFilter(
      activeFilters.jobType,
      (job, real) => real.includes(job.type),
      (job) => !job.type
    );

    applyFilter(
      activeFilters.experience,
      (job, real) => real.includes(job.experience),
      (job) => !job.experience
    );

    applyFilter(
      activeFilters.salaryRange,
      (job, real) => real.some(r => jobMatchesSalaryBucket(job.salary_min, job.salary_max, r)),
      (job) => job.salary_min == null && job.salary_max == null
    );

    applyFilter(
      activeFilters.companies,
      (job, real) => real.includes(job.company),
      (job) => !job.company
    );

    applyFilter(
      activeFilters.domain,
      (job, real) => !!(job.domains && job.domains.some(d => real.includes(d))),
      (job) => !job.domains || job.domains.length === 0
    );

    applyFilter(
      activeFilters.skills,
      (job, real) => job.skills.some(s => real.includes(s)),
      (job) => !job.skills || job.skills.length === 0
    );

    return filtered;
  }, [searchQuery, activeFilters, allJobs]);

  const visibleJobs = useMemo(() => filteredJobs.slice(0, displayCount), [filteredJobs, displayCount]);

  // Infinite scroll handler
  const loadMoreJobs = useCallback(() => {
    if (displayCount >= filteredJobs.length) return;
    setDisplayCount(prev => prev + 15);
  }, [displayCount, filteredJobs.length]);

  // Scroll event listener for infinite scroll and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      // Show scroll-to-top button when scrolled down 300px
      setShowScrollTop(scrollTop > 300);
      
      // Trigger infinite scroll when user is 1000px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        loadMoreJobs();
      }
    };

    const handleResize = () => {
      // Force scroll check after resize to ensure proper calculations
      setTimeout(handleScroll, 100);
    };

    // Initial scroll check after content loads
    const initialCheck = () => {
      setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Force initial scroll check to handle cases where content is already below fold
    initialCheck();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [loadMoreJobs]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleJobClick = (job: Job) => {
    void trackEvent('job_card_click', {
      entity_type: 'job',
      entity_id: job.id,
      metadata: { title: job.title, company: job.company },
    });
    // Always open in new tab for all screen sizes
    window.open(`/job/${job.id}`, '_blank');
  };

  // Debounced search tracking — fires once user pauses typing
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;
    const t = setTimeout(() => {
      void trackEvent('search', {
        search_query: q,
        result_count: filteredJobs.length,
      });
      if (filteredJobs.length === 0) {
        void trackEvent('search_zero_result', {
          search_query: q,
          result_count: 0,
        });
      }
    }, 800);
    return () => clearTimeout(t);
  }, [searchQuery, filteredJobs.length]);

  // Filter usage tracking — fires when any filter group changes
  const lastFilterSig = React.useRef<string>('');
  useEffect(() => {
    const sig = JSON.stringify(activeFilters);
    if (sig === lastFilterSig.current) return;
    const wasEmpty = lastFilterSig.current === '' || lastFilterSig.current === '{}';
    lastFilterSig.current = sig;
    const totalActive = Object.values(activeFilters).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );
    if (totalActive === 0 && !wasEmpty) {
      void trackEvent('filter_clear', { result_count: filteredJobs.length });
    } else if (totalActive > 0) {
      void trackEvent('filter_apply', {
        result_count: filteredJobs.length,
        metadata: { active_count: totalActive, filters: activeFilters },
      });
    }
  }, [activeFilters, filteredJobs.length]);

  // Restore scroll position when returning from job detail
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('jobListScrollPosition');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
      sessionStorage.removeItem('jobListScrollPosition');
    }
  }, []);

  const handleAdvertiseClick = () => {
    navigate('/advertise');
  };


  return (
    <div className="min-h-screen bg-background relative">
      <SEO 
        title="Find Your Dream Job"
        description="Discover exciting career opportunities in the railway industry. Browse thousands of job listings from top companies and find your perfect role today."
        canonical="/"
      />
      <WebsiteSchema />
      
      {/* Floating Bubbles Background */}
      
      
      {/* Main Content */}
      <div className="relative z-10">
        <NoticeBanner page="home" />
        {/* Header */}
        <Header 
          onAdvertiseClick={handleAdvertiseClick}
          onSearchChange={setSearchQuery}
          onFiltersChange={setActiveFilters}
          searchQuery={searchQuery}
          activeFilters={activeFilters}
          jobs={allJobs}
        />
        
        {/* Job Listings */}
        <main className="px-4 md:px-6 lg:px-8 py-8">
          <div className="flex justify-center gap-4 lg:gap-8">
            {/* Left Sidebar Ad - Hidden on mobile/tablet */}
            <div className="hidden lg:block w-[160px] flex-shrink-0">
              <div className="sticky top-28">
                <AdUnit size="sidebar" label="Left Sidebar Ad" />
              </div>
            </div>
            
            {/* Main Content */}
            <div className="w-full max-w-[1008px] flex-1">
            
            {/* Featured Section - Images only */}
            {featuredContent && featuredContent.length > 0 && (
              <FeaturedCarousel 
                title="" 
                items={featuredContent}
              />
            )}
            
            {/* Job Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-card rounded-xl p-6 animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                ))
              ) : visibleJobs.map((job, index) => (
                <React.Fragment key={job.id}>
                  <JobCard 
                    job={job} 
                    onClick={handleJobClick}
                  />
                </React.Fragment>
              ))}
            </div>
            
            {/* No results message */}
            {!isLoading && filteredJobs.length === 0 && (
              <div className="text-center py-12 md:col-span-2 lg:col-span-3">
                <p className="text-muted-foreground text-lg">No jobs found matching your criteria</p>
                <p className="text-muted-foreground text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            )}
            
            {/* Load More Indicator */}
            {!isLoading && displayCount < filteredJobs.length && (
              <div className="flex justify-center items-center py-12 md:col-span-2 lg:col-span-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-muted-foreground">Loading more opportunities...</span>
              </div>
            )}

            {/* End-of-jobs message */}
            {!isLoading && filteredJobs.length > 0 && displayCount >= filteredJobs.length && (
              <div className="mt-12 mx-auto max-w-3xl text-center">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-peach-glow mb-4"
                  aria-label="Refresh jobs"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  You've reached the end of the available jobs for this selection. To discover more opportunities, try adjusting your filters. In the meantime, explore{' '}
                  <Link to="/blogs" className="text-primary font-semibold hover:underline">Lighthouse</Link>
                  {' '}and{' '}
                  <Link to="/resources" className="text-primary font-semibold hover:underline">Resources</Link>
                  {' '}for curated insights, career guidance, and industry-specific knowledge.
                </p>
              </div>
            )}
            </div>
            
            {/* Right Sidebar Ad - Hidden on mobile/tablet */}
            <div className="hidden lg:block w-[160px] flex-shrink-0">
              <div className="sticky top-28">
                <AdUnit size="sidebar" label="Right Sidebar Ad" />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="sm"
          className={`
            fixed bottom-8 right-6 z-50
            h-10 w-10 rounded-full shadow-lg
            bg-primary hover:bg-primary-hover
            transition-all duration-300 ease-out
            animate-fade-in hover:scale-110
          `}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default Index;
