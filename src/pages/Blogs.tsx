import { Link } from "react-router-dom";
import { useMemo, useState, useEffect, type MouseEvent } from "react";
import { Calendar, User, Clock, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBlogs, useBlogTags, useBlogCategories } from "@/hooks/useBlogs";
import { useBlogAuthors } from "@/hooks/useBlogAuthors";
import { format } from "date-fns";
import SEO from "@/components/SEO";
import PageLayout from "@/components/PageLayout";
import TopBlogsCarousel from "@/components/TopBlogsCarousel";
import { useFeaturedBlogs } from "@/hooks/useTopBlogs";
import { cn } from "@/lib/utils";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";

type GroupKey = "category" | "tag" | "author";

const Blogs = () => {
  const { data: allBlogs, isLoading } = useBlogs();
  const { data: tags = [] } = useBlogTags();
  const { data: authors = [] } = useBlogAuthors();
  const { data: categories = [] } = useBlogCategories();
  const { data: featuredBlogs = [] } = useFeaturedBlogs();

  const [activeGroup, setActiveGroup] = useState<GroupKey | null>(null);
  const [expandedDescs, setExpandedDescs] = useState<Record<string, boolean>>({});
  const toggleDesc = (id: string) =>
    setExpandedDescs((prev) => ({ ...prev, [id]: !prev[id] }));
  const [selected, setSelected] = useState<Record<GroupKey, Set<string>>>({
    category: new Set(),
    tag: new Set(),
    author: new Set(),
  });

  const toggle = (group: GroupKey, id: string) => {
    setSelected((prev) => {
      const next = { ...prev, [group]: new Set(prev[group]) };
      if (next[group].has(id)) next[group].delete(id); else next[group].add(id);
      return next;
    });
  };

  const blogs = useMemo(() => {
    if (!allBlogs) return [];
    return allBlogs.filter((b) => {
      if (selected.category.size > 0 && !(b.category_id && selected.category.has(b.category_id))) return false;
      if (selected.tag.size > 0 && !b.tags.some((t) => selected.tag.has(t.id))) return false;
      if (selected.author.size > 0 && !b.authors.some((a) => selected.author.has(a.id))) return false;
      return true;
    });
  }, [allBlogs, selected]);

  const groups: { key: GroupKey; label: string; items: { id: string; name: string }[] }[] = [
    { key: "category", label: "Category", items: categories },
    { key: "tag", label: "Tag", items: tags },
    { key: "author", label: "Author", items: authors },
  ];

  const headerHeight = useHeaderHeight();
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <PageLayout prerenderReady={!isLoading && !!allBlogs}>
      <SEO
        title="Lighthouse — Career Insights & Articles"
        description="Stay updated with the latest news, insights, and trends. Expert career advice and industry updates."
        canonical="/blogs"
      />

      <main className="max-w-[1008px] mx-auto px-4 pt-4 pb-12">
        <h1 className="sr-only">Lighthouse</h1>
        <p className="text-foreground mb-6 text-lg md:text-xl font-medium italic">
          In the fog of information, Lighthouse illuminates your path with stories that guide and insights that shine.
        </p>

        {/* Filters (resource-style) — sticky above featured */}
        <div className="mb-6 space-y-3 sticky z-20 bg-background pb-2 pt-2 -mt-2" style={{ top: Math.max(0, headerHeight - 1) }}>
          <div className="flex items-center rounded-full border border-[hsl(217,91%,55%)] bg-[hsl(217,91%,55%)] w-fit max-w-full">
            <span className="shrink-0 px-4 py-1.5 text-sm font-semibold whitespace-nowrap bg-[hsl(210,100%,90%)] text-[hsl(217,91%,30%)] rounded-full m-1">
              Browse by
            </span>
            <div className="flex items-center overflow-x-auto scrollbar-hide">
              {groups.map((g) => (
                g.items.length > 0 && (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setActiveGroup((prev) => (prev === g.key ? null : g.key))}
                    className={cn(
                      "shrink-0 px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors border-l border-white/30 focus:outline-none select-none",
                      activeGroup === g.key
                        ? "bg-white/20 text-white"
                        : "text-white md:hover:bg-white/10"
                    )}
                  >
                    {g.label}
                  </button>
                )
              ))}
            </div>
          </div>
          {activeGroup && (() => {
            const g = groups.find((x) => x.key === activeGroup);
            if (!g) return null;
            return (
              <div className="relative rounded-lg bg-muted/60 border border-input p-2">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x pr-8">
                  {g.items.map((it) => {
                    const active = selected[g.key].has(it.id);
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => toggle(g.key, it.id)}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                        className={cn(
                          "shrink-0 snap-start rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer select-none focus:outline-none active:scale-95",
                          active
                            ? "bg-foreground/15 text-foreground ring-1 ring-foreground/20"
                            : "bg-transparent text-foreground/80 md:hover:text-foreground md:hover:bg-foreground/5"
                        )}
                      >
                        {it.name}
                      </button>
                    );
                  })}
                </div>
                <div className="pointer-events-none absolute right-2 top-2 bottom-2 w-8 bg-gradient-to-l from-muted to-transparent rounded-r-lg" />
              </div>
            );
          })()}
        </div>

        {featuredBlogs && featuredBlogs.length > 0 && (
          <TopBlogsCarousel blogs={featuredBlogs} title="Featured Articles" />
        )}
        {/* Grid */}
        {isLoading ? (
          <p className="text-muted-foreground">Loading blogs...</p>
        ) : blogs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 max-w-sm sm:max-w-none mx-auto">
            {blogs.map((blog) => {
              const blogHref = `/blog/${blog.slug}`;
              const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
                if ((event.target as HTMLElement).closest('a,button')) return;
                window.open(blogHref, '_blank', 'noopener,noreferrer');
              };

              return (
              <div key={blog.id} className="block h-full group">
                <Card
                  onClick={handleCardClick}
                  className="h-full overflow-hidden flex flex-col cursor-pointer hover:shadow-peach-glow transition-shadow"
                >
                  {blog.thumbnail_url && (
                    <Link
                      to={blogHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block relative w-full aspect-video bg-muted overflow-hidden"
                    >
                      <img
                        src={blog.thumbnail_url}
                        alt={blog.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                  )}
                  <CardHeader className="p-3 sm:p-4 pb-2">
                    <Link
                      to={blogHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block text-foreground no-underline hover:text-primary transition-colors"
                    >
                      <CardTitle className="text-base sm:text-lg line-clamp-2">{blog.title}</CardTitle>
                    </Link>
                    {blog.summary && (
                      <>
                        <CardDescription className={cn("mt-1 text-sm", expandedDescs[blog.id] ? "" : "line-clamp-2")}>
                          {blog.summary}
                        </CardDescription>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleDesc(blog.id); }}
                          className="mt-1 text-xs font-medium text-primary hover:underline self-start"
                        >
                          {expandedDescs[blog.id] ? "Show less" : "Read more"}
                        </button>
                      </>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 pt-0 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {blog.author && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {blog.author.name}
                        </span>
                      )}
                      {blog.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(blog.published_at), "MMM dd, yyyy")}
                        </span>
                      )}
                      {blog.read_time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {blog.read_time_minutes} min
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No blogs match your filters.</p>
        )}
      </main>

      {showScrollTop && (
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          size="sm"
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary-hover transition-all duration-300 ease-out animate-fade-in hover:scale-110"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </PageLayout>
  );
};

export default Blogs;
