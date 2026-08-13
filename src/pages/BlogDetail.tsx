import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import AdUnit from "@/components/AdUnit";
import { Calendar, User, Tag, Clock, Mail, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBlog } from "@/hooks/useBlogs";
import { format } from "date-fns";
import SEO from "@/components/SEO";
import BlogPostingSchema from "@/components/seo/BlogPostingSchema";
import PageLayout from "@/components/PageLayout";
import TopBlogsCarousel from "@/components/TopBlogsCarousel";
import RecommendedJobsCarousel from "@/components/RecommendedJobsCarousel";
import { useRecommendedBlogs, useRecentJobs } from "@/hooks/useRecommendations";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
    'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'pre', 'code', 'hr', 'sup', 'sub', 'figure', 'figcaption',
    // Rich media
    'video', 'audio', 'source', 'iframe', 'picture', 'track',
    // SVG (for shapes: arrow, line)
    'svg', 'line', 'polygon', 'polyline', 'rect', 'circle', 'path', 'g',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id',
    'width', 'height', 'loading',
    'controls', 'autoplay', 'loop', 'muted', 'preload', 'poster',
    'type', 'kind', 'srclang', 'label', 'default',
    'frameborder', 'allowfullscreen', 'allow', 'sandbox',
    'style',
    // Shape / column structural attrs
    'data-type', 'data-kind', 'data-cols',
    // SVG attrs
    'viewBox', 'preserveAspectRatio', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
    'cx', 'cy', 'r', 'd', 'points', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
  ],
  ALLOW_DATA_ATTR: true,
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
};

const BlogDetail = () => {
  const { blogId } = useParams();
  const { data: blog, isLoading } = useBlog(blogId);
  const { data: recommendedBlogs = [] } = useRecommendedBlogs({
    currentBlogId: blog?.id,
    categoryId: blog?.category_id,
    authorIds: blog?.authors?.map((a) => a.id) || [],
    tagIds: blog?.tags?.map((t) => t.id) || [],
    limit: 10,
  });
  const { data: recentJobs = [] } = useRecentJobs(10);

  useEffect(() => {
    if (blog?.id) {
      void trackEvent('blog_view', {
        entity_type: 'blog',
        entity_id: blog.id,
        metadata: { title: blog.title },
      });
    }
  }, [blog?.id]);

  return (
    <PageLayout prerenderReady={!isLoading}>
      {isLoading ? (
        <main className="max-w-[1008px] mx-auto px-4 pt-8 pb-12">
          <p className="text-muted-foreground">Loading blog...</p>
        </main>
      ) : !blog ? (
        <main className="max-w-[1008px] mx-auto px-4 pt-8 pb-12">
          <p className="text-muted-foreground">Blog not found.</p>
        </main>
      ) : (
        <>
          <SEO 
            title={blog.title}
            description={blog.summary || blog.title}
            canonical={`/blog/${blogId}`}
            ogType="article"
            publishedTime={blog.published_at || undefined}
            modifiedTime={blog.updated_at || undefined}
            author={blog.author?.name}
            ogImage={blog.thumbnail_url || undefined}
          />
          <BlogPostingSchema 
            title={blog.title}
            description={blog.summary || blog.title}
            slug={blogId || ''}
            authorName={blog.author?.name}
            authorUrl={blog.author?.profile_url || undefined}
            publishedDate={blog.published_at || undefined}
            modifiedDate={blog.updated_at || undefined}
            thumbnailUrl={blog.thumbnail_url || undefined}
            readTimeMinutes={blog.read_time_minutes || undefined}
          />
          
          <main className="max-w-[1008px] mx-auto px-4 pt-8 pb-12">
            <article className="prose prose-lg max-w-none">
              <h1 className="text-2xl md:text-4xl font-bold mb-4 text-foreground">{blog.title}</h1>

              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                {blog.authors && blog.authors.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <User className="w-4 h-4" />
                    <span className="flex flex-wrap items-center gap-x-1">
                      {blog.authors.map((a, i) => (
                        <span key={a.id} className="flex items-center">
                          {a.profile_url ? (
                            <a
                              href={a.profile_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary hover:underline transition-colors"
                            >
                              {a.name}
                            </a>
                          ) : (
                            <span>{a.name}</span>
                          )}
                          {i < blog.authors.length - 1 && <span>,</span>}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {blog.published_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(blog.published_at), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {blog.read_time_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{blog.read_time_minutes} min read</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {blog.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>

              {blog.content && (() => {
                const sanitized = sanitizeHtml(blog.content, PURIFY_CONFIG);
                const parts = sanitized.split('</p>');
                const firstPart = parts.slice(0, 3).join('</p>') + '</p>';
                const secondPart = '<p>' + parts.slice(3).join('</p>');
                return (
                  <>
                    <div 
                      className="text-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: firstPart }}
                      style={{ fontSize: '1.125rem', lineHeight: '1.75rem' }}
                    />
                    
                    <div className="my-8">
                      <AdUnit size="rectangle" label="In-content Ad 1" />
                    </div>
                    
                    <div 
                      className="text-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: secondPart }}
                      style={{ fontSize: '1.125rem', lineHeight: '1.75rem' }}
                    />
                  </>
                );
              })()}
            </article>

            {blog.authors && blog.authors.length > 0 && (
              <section className="mt-12 pt-8 border-t border-border">
                <h2 className="text-xl font-bold mb-6 text-foreground">
                  {blog.authors.length > 1 ? "About the Authors" : "About the Author"}
                </h2>
                <div className="space-y-6">
                  {blog.authors.map((a) => (
                    <div key={a.id} className="flex gap-4 p-4 rounded-lg bg-card border border-border">
                      {a.profile_pic_url ? (
                        <img
                          src={a.profile_pic_url}
                          alt={a.name}
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-7 h-7 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{a.name}</h3>
                        {a.bio && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.bio}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                          {a.profile_url && (
                            <a
                              href={a.profile_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Profile
                            </a>
                          )}
                          {a.show_email && a.email && (
                            <a
                              href={`mailto:${a.email}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              {a.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {recommendedBlogs.length > 0 && (
              <div className="mt-12">
                <TopBlogsCarousel blogs={recommendedBlogs} title="Recommended Blogs" />
              </div>
            )}

            {recentJobs.length > 0 && (
              <RecommendedJobsCarousel jobs={recentJobs} title="Recommended Jobs" />
            )}

            <div className="mt-12">
              <AdUnit size="rectangle" label="Bottom Ad" />
            </div>
          </main>
        </>
      )}
    </PageLayout>
  );
};

export default BlogDetail;
