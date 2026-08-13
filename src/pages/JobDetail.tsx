
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, IndianRupee, Building, Users, Calendar, ExternalLink, Send, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header, { FilterState } from '@/components/Header';
import AdUnit from '@/components/AdUnit';
import Footer from '@/components/Footer';
import { useJob } from '@/hooks/useJobs';
import { useRecommendedJobs } from '@/hooks/useRecommendedJobs';
import { useTopBlogs } from '@/hooks/useTopBlogs';
import { addViewedJob } from '@/hooks/useSessionJobHistory';
import { useFeaturedContent } from '@/hooks/useFeaturedContent';
import SEO from '@/components/SEO';
import JobPostingSchema from '@/components/seo/JobPostingSchema';
import { usePrerenderReady } from '@/hooks/usePrerenderReady';
import { trackEvent } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

// Open the user's default mail handler with prefilled recipient and subject.
const openMailCompose = (to: string, subject: string) => {
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}`;
};

// Below-the-fold — lazy load to keep initial JS small
const FeaturedCarousel = lazy(() => import('@/components/FeaturedCarousel'));
const TopBlogsCarousel = lazy(() => import('@/components/TopBlogsCarousel'));

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(jobId);
  // Defer non-critical queries until the main job has loaded so they don't compete with it
  const jobReady = !isLoading && !!job;
  const { data: recommendedJobs = [] } = useRecommendedJobs(jobReady ? jobId : undefined);
  const { data: topBlogs = [] } = useTopBlogs({ enabled: jobReady });
  const { data: jobDetailFeatured = [] } = useFeaturedContent('job_detail', { enabled: jobReady });

  // Signal prerenderer when job is loaded
  usePrerenderReady(!isLoading && !!job);

  // Track viewed job in session history for better recommendations
  useEffect(() => {
    if (jobId) {
      addViewedJob(jobId);
    }
  }, [jobId]);

  // Fire job_view analytics event once per job load
  useEffect(() => {
    if (job?.id) {
      void trackEvent('job_view', {
        entity_type: 'job',
        entity_id: job.id,
        metadata: { title: job.title, company: job.company_name },
      });
    }
  }, [job?.id]);
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="relative z-10">
          <Header 
            onAdvertiseClick={() => navigate('/advertise')}
            onSearchChange={setSearchQuery}
            onFiltersChange={setActiveFilters}
            searchQuery={searchQuery}
            activeFilters={activeFilters}
          />
          <main className="px-4 md:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-2xl shadow-peach-glow border border-[hsl(30_50%_80%)] p-6 animate-pulse">
                <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-muted rounded w-1/2 mb-6"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="relative z-10">
          <Header 
            onAdvertiseClick={() => navigate('/advertise')}
            onSearchChange={setSearchQuery}
            onFiltersChange={setActiveFilters}
            searchQuery={searchQuery}
            activeFilters={activeFilters}
          />
          <main className="px-4 md:px-8 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-xl md:text-2xl font-bold mb-4">Job Not Found</h1>
              <Button onClick={() => navigate('/')} className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <SEO 
        title={`${job.title} at ${job.company_name}`}
        description={job.description?.slice(0, 160) || `Apply for ${job.title} position at ${job.company_name}. ${job.type} role in ${job.location}.`}
        canonical={`/job/${jobId}`}
        ogType="job"
      />
      <JobPostingSchema 
        title={job.title}
        description={job.description || ''}
        companyName={job.company_name}
        companyLogo={job.companyLogo}
        locations={job.locations}
        salaryMin={job.salary_min}
        salaryMax={job.salary_max}
        currency={job.currency || 'INR'}
        jobType={job.type}
        workMode={job.work_mode}
        datePosted={job.created_at}
        validThrough={job.deadline}
        jobId={job.id}
      />
      
      
      <div className="relative z-10">
        <Header 
          onAdvertiseClick={() => navigate('/advertise')}
          onSearchChange={setSearchQuery}
          onFiltersChange={setActiveFilters}
          searchQuery={searchQuery}
          activeFilters={activeFilters}
        />
        
        <main className="px-4 md:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Top Job Detail Ad */}
            <div className="mb-6">
              <AdUnit size="banner" label="Job Detail Header Ad" />
            </div>

            {/* Job Header */}
            <div className="bg-card rounded-2xl shadow-peach-glow border border-[hsl(30_50%_80%)] p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                {job.companyLogo ? (
                  <img 
                    src={job.companyLogo} 
                    alt={`${job.company_name} logo`}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-2xl">
                      {job.company_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-xl md:text-3xl font-bold text-card-foreground mb-2">{job.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="w-5 h-5" />
                    <span className="text-lg">{job.company_name}</span>
                  </div>
                </div>
              </div>

              {/* Job Overview Grid - 6 cells in single row on lg */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-xl min-w-0">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Location</p>
                    {job.locations && job.locations.length > 0 ? (
                      <p className="font-medium text-sm truncate">
                        {job.locations[0].city}{job.locations.length > 1 ? ` +${job.locations.length - 1}` : ''}
                      </p>
                    ) : (
                      <p className="font-medium text-sm">NA</p>
                    )}
                    {job.work_mode && (
                      <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0 h-4">
                        {job.work_mode}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-xl min-w-0">
                  <IndianRupee className="w-4 h-4 text-success shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Salary</p>
                    <p className="font-medium text-sm truncate">{job.salary || 'NA'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-xl min-w-0">
                  <Clock className="w-4 h-4 text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Job Type</p>
                    <p className="font-medium text-sm truncate">{job.type || 'NA'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-xl min-w-0">
                  <Users className="w-4 h-4 text-purple-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Experience</p>
                    <p className="font-medium text-sm truncate">{job.experience || 'NA'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-xl min-w-0">
                  <Building className="w-4 h-4 text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Domain</p>
                    <p className="font-medium text-sm truncate">
                      {job.domains && job.domains.length > 0
                        ? `${job.domains[0]}${job.domains.length > 1 ? ` +${job.domains.length - 1}` : ''}`
                        : 'NA'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-xl min-w-0">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Deadline</p>
                    <p className="font-medium text-sm truncate">
                      {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'NA'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Posted date */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pt-2 border-t border-border">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Posted {job.postedTime}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {job.applicationLink ? (
                  <Button 
                    onClick={() => { void trackEvent('apply_click', { entity_type: 'job', entity_id: job.id, metadata: { method: 'url', placement: 'top' } }); window.open(job.applicationLink, '_blank'); }}
                    className="bg-gradient-to-r from-accent to-accent-hover hover:from-accent-hover hover:to-accent text-accent-foreground px-6 sm:px-8 py-2 sm:py-3 rounded-full font-medium flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Apply Now
                  </Button>
                ) : job.applicationEmail ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                      To apply, send your resume to:
                    </p>
                    <Button 
                      onClick={() => { void trackEvent('apply_email_click', { entity_type: 'job', entity_id: job.id, metadata: { method: 'email', placement: 'top' } }); openMailCompose(job.applicationEmail!, `Application for ${job.title} Position`); }}
                      className="bg-gradient-to-r from-accent to-accent-hover hover:from-accent-hover hover:to-accent text-accent-foreground px-6 sm:px-8 py-2 sm:py-3 rounded-full font-medium flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {job.applicationEmail}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    disabled
                    className="bg-muted text-muted-foreground px-6 sm:px-8 py-2 sm:py-3 rounded-full font-medium"
                  >
                    Application information not available
                  </Button>
                )}
                {job.companyWebsite && (
                  <Button 
                    onClick={() => window.open(job.companyWebsite, '_blank')}
                    variant="outline" 
                    className="rounded-full flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </Button>
                )}
                <Button 
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(`${job.company_name} company`)}`, '_blank')}
                  variant="outline" 
                  className="rounded-full flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Search on Google
                </Button>
                {job.jd_file_url && (
                  <Button 
                    onClick={() => window.open(job.jd_file_url, '_blank')}
                    variant="outline" 
                    className="rounded-full flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download JD
                  </Button>
                )}
              </div>
            </div>

            {/* Skills Required */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-card rounded-2xl shadow-peach-glow border border-[hsl(30_50%_80%)] p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-card-foreground">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1 rounded-full">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Job Description */}
            {job.description && (
              <div className="bg-card rounded-2xl shadow-peach-glow border border-[hsl(30_50%_80%)] p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-card-foreground">About the Role</h2>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground [&_h1]:text-card-foreground [&_h2]:text-card-foreground [&_h3]:text-card-foreground [&_h4]:text-card-foreground [&_strong]:text-card-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description) }}
                />
              </div>
            )}
            
            {/* Mid-content Ad */}
            <div className="mb-6">
              <AdUnit size="rectangle" label="Mid-content Rectangle Ad" />
            </div>

            {/* Eligibility Criteria */}
            {job.eligibility && (
              <div className="bg-card rounded-2xl shadow-peach-glow border border-[hsl(30_50%_80%)] p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-card-foreground">Eligibility Criteria</h2>
                <div className="space-y-4 text-muted-foreground">
                  {job.eligibility.education_level && (
                    <div>
                      <h3 className="font-semibold text-card-foreground mb-2">Education Requirements:</h3>
                      <p>{job.eligibility.education_level}</p>
                    </div>
                  )}
                  {(job.eligibility.min_experience || job.eligibility.max_experience) && (
                    <div>
                      <h3 className="font-semibold text-card-foreground mb-2">Experience Level:</h3>
                      <p>
                        {job.eligibility.min_experience && job.eligibility.max_experience
                          ? `${job.eligibility.min_experience}-${job.eligibility.max_experience} years of experience`
                          : job.eligibility.min_experience
                          ? `Minimum ${job.eligibility.min_experience} years of experience`
                          : job.eligibility.max_experience
                          ? `Maximum ${job.eligibility.max_experience} years of experience`
                          : 'Experience level not specified'}
                      </p>
                    </div>
                  )}
                  {job.eligibility.age_limit && (
                    <div>
                      <h3 className="font-semibold text-card-foreground mb-2">Age Limit:</h3>
                      <p>Maximum {job.eligibility.age_limit} years</p>
                    </div>
                  )}
                  {job.eligibility.other_criteria && (
                    <div>
                      <h3 className="font-semibold text-card-foreground mb-2">Other Criteria:</h3>
                      <p>{job.eligibility.other_criteria}</p>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Apply Button */}
            <div className="flex justify-center mb-6">
              {job.applicationLink ? (
                <Button 
                  onClick={() => { void trackEvent('apply_click', { entity_type: 'job', entity_id: job.id, metadata: { method: 'url', placement: 'bottom' } }); window.open(job.applicationLink, '_blank'); }}
                  className="bg-gradient-to-r from-accent to-accent-hover hover:from-accent-hover hover:to-accent text-accent-foreground px-8 py-3 rounded-full font-medium flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Apply Now
                </Button>
              ) : job.applicationEmail ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    To apply, send your resume to:
                  </p>
                  <Button 
                    onClick={() => { void trackEvent('apply_email_click', { entity_type: 'job', entity_id: job.id, metadata: { method: 'email', placement: 'bottom' } }); openMailCompose(job.applicationEmail!, `Application for ${job.title} Position`); }}
                    className="bg-gradient-to-r from-accent to-accent-hover hover:from-accent-hover hover:to-accent text-accent-foreground px-8 py-3 rounded-full font-medium flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {job.applicationEmail}
                  </Button>
                </div>
              ) : (
                <Button 
                  disabled
                  className="bg-muted text-muted-foreground px-8 py-3 rounded-full font-medium"
                >
                  Application information not available
                </Button>
              )}
            </div>
            
            {/* Below-the-fold carousels — lazy + suspended so they don't block first paint */}
            <Suspense fallback={null}>
              {jobDetailFeatured && jobDetailFeatured.length > 0 && (
                <FeaturedCarousel
                  title="Featured"
                  items={jobDetailFeatured as any}
                  displayLocation="job_detail"
                />
              )}

              {recommendedJobs && recommendedJobs.length > 0 && (
                <FeaturedCarousel
                  title="You May Also Like"
                  jobs={recommendedJobs}
                  jobsOnly={true}
                />
              )}

              {topBlogs && topBlogs.length > 0 && (
                <TopBlogsCarousel blogs={topBlogs} />
              )}
            </Suspense>

            {/* Bottom Ad */}
            <div className="mb-6">
              <AdUnit size="banner" label="Bottom Banner Ad" />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default JobDetail;
