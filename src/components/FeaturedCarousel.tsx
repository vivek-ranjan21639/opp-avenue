import React from 'react';
import { ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Job } from '@/components/JobCard';
import JobCard from '@/components/JobCard';
import FeaturedJobCard from '@/components/FeaturedJobCard';
import { trackEvent } from '@/lib/analytics';

interface FeaturedItem {
  id: string;
  content_type: 'poster_static' | 'poster_clickable' | 'poster_job_link' | 'job_card';
  image_url?: string | null;
  title?: string | null;
  link_url?: string | null;
  job_id?: string | null;
  job?: Job | null;
}

interface FeaturedCarouselProps {
  title: string;
  items?: FeaturedItem[];
  jobs?: Job[];
  jobsOnly?: boolean;
  onJobClick?: (job: Job) => void;
  displayLocation?: 'home' | 'job_detail' | string;
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ title, items = [], jobs = [], jobsOnly = false, onJobClick, displayLocation = 'home' }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const autoScrollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoScrollPausedRef = React.useRef<boolean>(false);
  const isHoveringRef = React.useRef<boolean>(false);

  const baseItems: Array<FeaturedItem | Job> = jobsOnly ? jobs : items;
  // Disable infinite-loop tripling — it caused the same item to render multiple times
  // in the visible viewport when only a few items were configured. Use a simple wrap.
  const shouldLoop = false;
  const duplicatedFeatured = React.useMemo<FeaturedItem[]>(() => {
    if (jobsOnly) return [];
    return items;
  }, [items, jobsOnly]);

  const scrollByOneCard = React.useCallback((direction: 'left' | 'right' = 'right') => {
    const container = scrollContainerRef.current;
    if (!container || container.children.length === 0) return;

    const firstCard = container.children[0] as HTMLElement;
    const cardWidth = firstCard.offsetWidth + 16; // 16px = gap-4

    if (!shouldLoop) {
      // Simple scroll without infinite-loop tripling
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (direction === 'right') {
        if (container.scrollLeft >= maxScroll - 8) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      } else {
        container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      }
      return;
    }

    const totalWidth = container.scrollWidth / 3; // because we tripled

    if (direction === 'right') {
      if (container.scrollLeft >= totalWidth * 2) {
        container.scrollLeft = container.scrollLeft - totalWidth;
      }
      container.scrollBy({ left: cardWidth, behavior: 'smooth' });
    } else {
      if (container.scrollLeft <= cardWidth) {
        container.scrollLeft = container.scrollLeft + totalWidth;
      }
      container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  }, [shouldLoop]);

  const scroll = (direction: 'left' | 'right') => {
    const totalItems = baseItems.length;
    if (totalItems === 0) return;
    scrollByOneCard(direction);
    if (!jobsOnly) {
      pauseAutoScroll();
    }
  };

  // Pause auto-scroll for 10 seconds on manual interaction
  const pauseAutoScroll = React.useCallback(() => {
    isAutoScrollPausedRef.current = true;
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      isAutoScrollPausedRef.current = false;
    }, 10000);
  }, []);

  const handleManualScroll = React.useCallback(() => {
    pauseAutoScroll();
  }, [pauseAutoScroll]);

  // Initialize scroll position to middle copy for seamless looping
  React.useEffect(() => {
    if (!shouldLoop) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      const totalWidth = container.scrollWidth / 3;
      container.scrollLeft = totalWidth;
    });
  }, [shouldLoop, baseItems.length]);

  // Auto-scroll: advance one card every 3 seconds (only when more than 1 item)
  React.useEffect(() => {
    if (jobsOnly || baseItems.length <= 1) return;

    autoScrollRef.current = setInterval(() => {
      if (!isAutoScrollPausedRef.current && !isHoveringRef.current) {
        scrollByOneCard('right');
      }
    }, 3000);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, [jobsOnly, baseItems.length, scrollByOneCard]);

  // Manual scroll detection
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || jobsOnly) return;

    const handleWheel = () => handleManualScroll();
    const handleTouchStart = () => handleManualScroll();

    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [jobsOnly, handleManualScroll]);

  // Log a single impression per unique featured item the first time the carousel renders.
  const impressionsLoggedRef = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    if (jobsOnly) return; // jobs-only carousel is recommendations, not featured items
    items.forEach((it) => {
      if (impressionsLoggedRef.current.has(it.id)) return;
      impressionsLoggedRef.current.add(it.id);
      void trackEvent('featured_impression', {
        entity_type: null,
        entity_id: it.id,
        metadata: {
          content_type: it.content_type,
          display_location: displayLocation,
          linked_job_id: it.job_id ?? null,
        },
      });
    });
  }, [items, jobsOnly, displayLocation]);

  const logFeaturedClick = (it: FeaturedItem) => {
    void trackEvent('featured_click', {
      entity_type: null,
      entity_id: it.id,
      metadata: {
        content_type: it.content_type,
        display_location: displayLocation,
        linked_job_id: it.job_id ?? null,
      },
    });
  };

  const handleItemClick = (item: FeaturedItem) => {
    logFeaturedClick(item);
    if (item.content_type === 'poster_clickable' && item.link_url) {
      window.open(item.link_url, '_blank');
    } else if (item.content_type === 'poster_job_link' && item.job_id) {
      window.open(`/job/${item.job_id}`, '_blank');
    } else if (item.content_type === 'job_card' && item.job_id) {
      window.open(`/job/${item.job_id}`, '_blank');
    }
  };

  const handleJobClick = (job: Job) => {
    if (onJobClick) {
      onJobClick(job);
    } else {
      window.open(`/job/${job.id}`, '_blank');
    }
  };

  const displayItems = jobsOnly ? jobs : items;
  if (!displayItems || displayItems.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        {title ? <h2 className="text-xl md:text-3xl font-bold text-foreground">{title}</h2> : <span />}
        <div className="flex gap-2 lg:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="h-8 w-8 md:h-10 md:w-10 bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="h-8 w-8 md:h-10 md:w-10 bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>

      <div
        className="relative"
        onMouseEnter={() => { isHoveringRef.current = true; }}
        onMouseLeave={() => { isHoveringRef.current = false; }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll('left')}
          className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-muted/90 border-border/50 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors shadow-md"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {jobsOnly ? (
            jobs.map((job) => (
              <div key={job.id} className="flex-shrink-0 w-[320px]">
                <div
                  className="rounded-xl p-1 shadow-md hover:shadow-lg transition-shadow"
                  style={{
                    background: 'linear-gradient(135deg, hsl(30 50% 85% / 0.4), hsl(35 45% 80% / 0.3))',
                    border: '1px solid hsl(30 40% 75% / 0.5)'
                  }}
                >
                  <JobCard job={job} onClick={() => handleJobClick(job)} />
                </div>
              </div>
            ))
          ) : (
            duplicatedFeatured.map((item, idx) => {
              const isJobCard = item.content_type === 'job_card';
              const isClickable = item.content_type !== 'poster_static';

              // For real job cards from j_jobs, render the standard JobCard so all info matches the normal listing
              if (isJobCard && item.job) {
                return (
                  <div key={`${item.id}-${idx}`} className="flex-shrink-0">
                    <FeaturedJobCard
                      job={item.job}
                      onClick={() => { logFeaturedClick(item); handleJobClick(item.job!); }}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[50vw] lg:w-[400px]"
                >
                  <div
                    className={`relative h-[300px] rounded-lg overflow-hidden border border-border ${
                      isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <img
                      src={item.image_url || '/placeholder.svg'}
                      alt={item.title || 'Featured content'}
                      className="w-full h-full object-cover"
                    />
                    {item.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <h3 className="text-white font-semibold">{item.title}</h3>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll('right')}
          className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-muted/90 border-border/50 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors shadow-md"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default FeaturedCarousel;
