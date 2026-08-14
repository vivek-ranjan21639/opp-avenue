import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useResourceBySlug, DEFAULT_FIELD_CONFIG, type ResourceFieldConfig } from "@/hooks/useResources";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, ExternalLink, ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";
import PageLayout from "@/components/PageLayout";
import { trackEvent } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const PURIFY = {
  ALLOWED_TAGS: [
    'p','br','strong','em','u','a','ul','ol','li','h1','h2','h3','h4','h5','h6',
    'blockquote','img','span','div','table','thead','tbody','tr','th','td','pre',
    'code','hr','sup','sub','figure','figcaption','video','audio','source','iframe',
    'picture','track',
  ],
  ALLOWED_ATTR: [
    'href','target','rel','src','alt','title','class','id','width','height','loading',
    'controls','autoplay','loop','muted','preload','poster','type','kind','srclang',
    'label','default','frameborder','allowfullscreen','allow','sandbox','style',
    'data-type','data-kind','data-cols',
  ],
  ALLOW_DATA_ATTR: true,
};

export default function ResourceDetail() {
  const { slug, categorySlug } = useParams();
  const navigate = useNavigate();
  const { data: resource, isLoading, error } = useResourceBySlug(slug);

  const fieldConfig: ResourceFieldConfig = {
    ...DEFAULT_FIELD_CONFIG,
    ...(((resource as any)?.r_categories?.field_config) || {}),
  };
  const contentEnabled = !!fieldConfig.content;
  const hasContent = contentEnabled && !!(resource?.content && resource.content.trim());

  // If the category no longer allows content, redirect to external link (or back to category)
  useEffect(() => {
    if (!resource) return;
    if (!contentEnabled) {
      const ext = fieldConfig.link ? (resource as any).video_url : null;
      if (ext) {
        window.location.replace(ext);
      } else {
        navigate(`/resources/${categorySlug || ''}`, { replace: true });
      }
    }
  }, [resource, contentEnabled, fieldConfig.link, categorySlug, navigate]);

  useEffect(() => {
    if (resource) {
      void trackEvent('resource_view', {
        entity_type: 'resource',
        entity_id: resource.id,
        metadata: { title: resource.title, type: resource.resource_type, category: categorySlug },
      });
    }
  }, [resource, categorySlug]);

  if (isLoading) {
    return (
      <PageLayout prerenderReady={false}>
        <main className="max-w-[1008px] mx-auto px-4 pt-8 pb-12">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </PageLayout>
    );
  }

  if (error || !resource) {
    return (
      <PageLayout prerenderReady>
        <main className="max-w-[1008px] mx-auto px-4 pt-8 pb-12">
          <p className="text-muted-foreground">Resource not found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to={`/resources/${categorySlug || ''}`}>Back</Link>
          </Button>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout prerenderReady>
      <SEO
        title={resource.title}
        description={resource.description || `${resource.title} — career resource`}
        canonical={`/resources/${categorySlug}/${resource.slug}`}
      />

      <main className="max-w-[1008px] mx-auto px-4 pt-8 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Button asChild variant="ghost" size="icon">
            <Link to={`/resources/${categorySlug || ''}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-4xl font-bold text-foreground">{resource.title}</h1>
            </div>
            {resource.description && (
              <p className="text-muted-foreground mt-2">{resource.description}</p>
            )}
          </div>
        </div>

        {resource.r_resource_files && resource.r_resource_files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {resource.r_resource_files.filter((f: any) => f.file_url).map((file: any) => (
              <Button key={file.id} variant="outline" className="gap-2" asChild>
                <a
                  href={file.file_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={file.is_downloadable ?? true}
                  onClick={() => {
                    void trackEvent('resource_download', {
                      entity_type: 'resource',
                      entity_id: resource.id,
                      metadata: { file_id: file.id, file_type: file.file_type, downloadable: file.is_downloadable },
                    });
                  }}
                >
                  {file.is_downloadable ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                  {file.file_type || 'Download'}
                </a>
              </Button>
            ))}
          </div>
        )}

        {hasContent && (
          <article
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(resource.content!, PURIFY) }}
          />
        )}


        {resource.r_resource_tags_map && resource.r_resource_tags_map.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-6">
            {resource.r_resource_tags_map.map((tm: any) => (
              <Badge key={tm.r_tags.id} variant="secondary" className="text-xs">{tm.r_tags.name}</Badge>
            ))}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
