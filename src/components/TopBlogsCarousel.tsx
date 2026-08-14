import React from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { TopBlog } from '@/hooks/useTopBlogs';

interface TopBlogsCarouselProps {
  blogs: TopBlog[];
  title?: string;
}

const TopBlogsCarousel: React.FC<TopBlogsCarouselProps> = ({ blogs, title = 'Top Articles' }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const isPausedRef = React.useRef(false);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll every 3 seconds with seamless loop-back
  React.useEffect(() => {
    if (!blogs || blogs.length <= 1) return;
    const id = setInterval(() => {
      const c = scrollContainerRef.current;
      if (!c || isPausedRef.current) return;
      const maxScroll = c.scrollWidth - c.clientWidth;
      if (c.scrollLeft >= maxScroll - 8) {
        c.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        c.scrollBy({ left: 340, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(id);
  }, [blogs]);

  if (!blogs || blogs.length === 0) return null;


  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
        {/* Mobile/Tablet navigation buttons - hidden on desktop */}
        <div className="flex gap-2 lg:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel container with side arrows on desktop */}
      <div
        className="relative"
        onMouseEnter={() => { isPausedRef.current = true; }}
        onMouseLeave={() => { isPausedRef.current = false; }}
      >
        {/* Desktop left arrow */}
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
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {blogs.map((blog) => (
            <Card
              key={blog.id}
              className="flex-shrink-0 w-[320px] cursor-pointer hover:shadow-lg transition-shadow overflow-hidden relative"
            >
              <Link
                to={`/blog/${blog.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read ${blog.title}`}
                className="absolute inset-0 z-10"
              />
              {/* Background Image - always show, use thumbnail or placeholder */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${blog.thumbnail_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop'})` 
                }}
              >
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
              </div>
              
              {/* Content */}
              <div className="relative z-20 p-4 h-[200px] flex flex-col justify-end pointer-events-none">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-white">{blog.title}</h3>
                <div className="flex items-center justify-between">
                  {blog.authors && (
                    <div className="flex items-center gap-2">
                      {blog.authors.profile_pic_url && (
                        <img
                          src={blog.authors.profile_pic_url}
                          alt={blog.authors.name}
                          className="w-6 h-6 rounded-full border border-white/30"
                        />
                      )}
                      {blog.authors.profile_url ? (
                        <a
                          href={blog.authors.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pointer-events-auto text-sm text-white/90 hover:text-white hover:underline transition-colors"
                        >
                          {blog.authors.name}
                        </a>
                      ) : (
                        <span className="text-sm text-white/80">{blog.authors.name}</span>
                      )}
                    </div>
                  )}
                  {blog.read_time_minutes && (
                    <div className="flex items-center gap-1 text-white/70 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{blog.read_time_minutes} min read</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop right arrow */}
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

export default TopBlogsCarousel;
