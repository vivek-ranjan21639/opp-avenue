import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import JobCard, { Job } from '@/components/JobCard';

interface Props {
  jobs: Job[];
  title?: string;
}

const RecommendedJobsCarousel: React.FC<Props> = ({ jobs, title = 'Recommended Jobs' }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isPausedRef = React.useRef(false);
  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    if (!jobs || jobs.length <= 1) return;
    const id = setInterval(() => {
      const c = scrollRef.current;
      if (!c || isPausedRef.current) return;
      const maxScroll = c.scrollWidth - c.clientWidth;
      if (c.scrollLeft >= maxScroll - 8) {
        c.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        c.scrollBy({ left: 340, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(id);
  }, [jobs]);

  if (!jobs || jobs.length === 0) return null;

  const handleClick = (job: Job) => {
    window.open(`/job/${job.id}`, '_blank');
  };

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
        <div className="flex gap-2 lg:hidden">
          <Button variant="outline" size="icon" onClick={() => scroll('left')} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scroll('right')} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        className="relative"
        onMouseEnter={() => { isPausedRef.current = true; }}
        onMouseLeave={() => { isPausedRef.current = false; }}
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
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {jobs.map((job) => (
            <div key={job.id} className="flex-shrink-0 w-[320px]">
              <JobCard job={job} onClick={handleClick} />
            </div>
          ))}
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
    </section>
  );
};

export default RecommendedJobsCarousel;
