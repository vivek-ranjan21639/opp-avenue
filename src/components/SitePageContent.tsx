import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const PURIFY = {
  ALLOWED_TAGS: [
    'p','br','strong','em','u','a','ul','ol','li','h1','h2','h3','h4','h5','h6',
    'blockquote','img','span','div','table','thead','tbody','tr','th','td','pre',
    'code','hr','sup','sub','figure','figcaption','video','audio','source','iframe',
    'picture','track','svg','line','polygon','polyline','rect','circle','path','g',
  ],
  ALLOWED_ATTR: [
    'href','target','rel','src','alt','title','class','id','width','height','loading',
    'controls','autoplay','loop','muted','preload','poster','type','kind','srclang',
    'label','default','frameborder','allowfullscreen','allow','sandbox','style',
    'data-type','data-kind','data-cols',
    'viewBox','preserveAspectRatio','x','y','x1','y1','x2','y2','cx','cy','r','d',
    'points','fill','stroke','stroke-width','stroke-linecap',
  ],
  ALLOW_DATA_ATTR: true,
};

interface Props {
  slug: string;
  /** Render this fallback when admin content is empty or disabled */
  fallback: React.ReactNode;
}

export const fetchSitePageContent = async (slug: string): Promise<string | null> => {
  const { data } = await supabase
    .from('site_pages')
    .select('content, enabled')
    .eq('slug', slug)
    .maybeSingle();

  if (data && data.enabled && data.content && data.content.trim().length > 0) {
    return data.content;
  }
  return null;
};

export const sitePageContentQueryOptions = (slug: string) => ({
  queryKey: ['site-page-content', slug] as const,
  queryFn: () => fetchSitePageContent(slug),
});

/**
 * Renders admin-managed rich-text content for a static page (About, Advertise),
 * falling back to hardcoded layout if the row is disabled or empty.
 */
export default function SitePageContent({ slug, fallback }: Props) {
  const { data: html = null, isLoading } = useQuery(sitePageContentQueryOptions(slug));

  if (isLoading) return null;
  if (!html) return <>{fallback}</>;

  return (
    <article
      className="prose prose-sm sm:prose lg:prose-lg max-w-none [&_.editor-columns]:grid [&_.editor-columns-2]:grid-cols-2 [&_.editor-columns-3]:grid-cols-3 [&_.editor-columns-4]:grid-cols-4 [&_.editor-columns-5]:grid-cols-5 [&_.editor-columns-6]:grid-cols-6 [&_.editor-columns]:gap-4"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html, PURIFY) }}
    />
  );
}
