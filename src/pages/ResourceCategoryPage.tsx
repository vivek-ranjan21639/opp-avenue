import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { usePublishedResources, useResourceCategories, useResourceTagGroups, DEFAULT_FIELD_CONFIG, type ResourceFieldConfig } from "@/hooks/useResources";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Download, ExternalLink, ArrowLeft, PlayCircle } from "lucide-react";
import SEO from "@/components/SEO";
import PageLayout from "@/components/PageLayout";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";

function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getVideoThumbnail(videoUrl?: string | null, explicit?: string | null): string | null {
  if (explicit) return explicit;
  const yt = getYouTubeId(videoUrl);
  if (yt) return `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`;
  return null;
}

export default function ResourceCategoryPage() {
  const { categorySlug } = useParams();
  const { data: resources = [], isLoading } = usePublishedResources(categorySlug);
  const { data: categories = [] } = useResourceCategories();
  const currentCategory = categories.find((c) => c.slug === categorySlug);
  const view: 'list' | 'grid' = currentCategory?.default_view === 'grid' ? 'grid' : 'list';
  const fieldConfig: ResourceFieldConfig = { ...DEFAULT_FIELD_CONFIG, ...((currentCategory?.field_config) || {}) };
  const { data: tagGroups = [] } = useResourceTagGroups(currentCategory?.id || null);

  const categoryName = currentCategory?.name || resources[0]?.r_categories?.name || categorySlug?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Resources';

  // selectedTagsByGroup: group_id -> Set<tag_id>
  const [selectedTagsByGroup, setSelectedTagsByGroup] = useState<Record<string, Set<string>>>({});

  const toggleTag = (groupId: string, tagId: string) => {
    setSelectedTagsByGroup((prev) => {
      const next = { ...prev };
      const set = new Set(next[groupId] || []);
      if (set.has(tagId)) set.delete(tagId); else set.add(tagId);
      next[groupId] = set;
      return next;
    });
  };

  const headerHeight = useHeaderHeight();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [expandedDescs, setExpandedDescs] = useState<Record<string, boolean>>({});
  const toggleDesc = (id: string) => {
    setExpandedDescs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtering: if tags selected -> OR across them. Else if a group is active -> show resources with any tag in that group.
  const filteredResources = useMemo(() => {
    const allSelected = new Set<string>();
    Object.values(selectedTagsByGroup).forEach((s) => s.forEach((id) => allSelected.add(id)));
    if (allSelected.size > 0) {
      return resources.filter((r) => {
        const tagIds = (r.r_resource_tags_map || []).map((m: any) => m.r_tags?.id).filter(Boolean);
        return tagIds.some((id: string) => allSelected.has(id));
      });
    }
    if (activeGroupId) {
      const activeGroup: any = tagGroups.find((g: any) => g.id === activeGroupId);
      const groupTagIds = new Set<string>((activeGroup?.tags || []).map((t: any) => t.id));
      if (groupTagIds.size === 0) return resources;
      return resources.filter((r) => {
        const tagIds = (r.r_resource_tags_map || []).map((m: any) => m.r_tags?.id).filter(Boolean);
        return tagIds.some((id: string) => groupTagIds.has(id));
      });
    }
    return resources;
  }, [resources, selectedTagsByGroup, activeGroupId, tagGroups]);

  useEffect(() => {
    if (!resources.length) return;
    resources.forEach((r) => {
      void trackEvent('resource_view', {
        entity_type: 'resource',
        entity_id: r.id,
        metadata: { title: r.title, type: r.resource_type, category: categorySlug },
      });
    });
  }, [resources, categorySlug]);

  return (
    <PageLayout prerenderReady={!isLoading}>
      <SEO
        title={categoryName}
        description={`Browse ${categoryName} resources to advance your career.`}
        canonical={`/resources/${categorySlug}`}
      />

      <main className="max-w-[1008px] mx-auto px-4 pt-8 pb-12">

        {/* Tag group filters */}
        {tagGroups.length > 0 && (
          <div className="mb-6 space-y-3 sticky z-20 bg-background pb-2 pt-2 -mt-2" style={{ top: Math.max(0, headerHeight - 1) }}>
            <div className="flex items-center rounded-full border border-[hsl(217,91%,55%)] bg-[hsl(217,91%,55%)] w-fit max-w-full">
              <span className="shrink-0 px-4 py-1.5 text-sm font-semibold whitespace-nowrap bg-[hsl(210,100%,90%)] text-[hsl(217,91%,30%)] rounded-full m-1">
                Browse by
              </span>
              <div className="flex items-center overflow-x-auto scrollbar-hide">
                {tagGroups.map((g: any) => (
                  g.tags.length > 0 && (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setActiveGroupId((prev) => prev === g.id ? null : g.id)}
                      className={cn(
                        "shrink-0 px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors border-l border-white/30 focus:outline-none select-none",
                        activeGroupId === g.id
                          ? "bg-white/20 text-white"
                        : "text-white md:hover:bg-white/10"
                      )}
                    >
                      {g.name}
                    </button>
                  )
                ))}
              </div>
            </div>
            {activeGroupId && (() => {
              const g: any = tagGroups.find((x: any) => x.id === activeGroupId);
              if (!g) return null;
              return (
                <div className="relative rounded-lg bg-muted/60 border border-input p-2">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x pr-8">
                    {g.tags.map((t: any) => {
                      const active = selectedTagsByGroup[g.id]?.has(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTag(g.id, t.id)}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                          className={cn(
                            "shrink-0 snap-start rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer select-none focus:outline-none active:scale-95",
                            active
                              ? "bg-foreground/15 text-foreground ring-1 ring-foreground/20"
                              : "bg-transparent text-foreground/80 md:hover:text-foreground md:hover:bg-foreground/5"
                          )}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pointer-events-none absolute right-2 top-2 bottom-2 w-8 bg-gradient-to-l from-muted to-transparent rounded-r-lg" />
                </div>
              );
            })()}
          </div>
        )}

        <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 max-w-sm sm:max-w-none mx-auto' : 'space-y-6'}>
          {isLoading ? (
            <p className="text-muted-foreground">Loading resources...</p>
          ) : filteredResources.length > 0 ? (
            filteredResources.map((resource) => {
              const videoUrl = (resource as any).video_url as string | null;
              // Only treat as internal content if the category currently allows the content field
              const hasContent = !!fieldConfig.content && !!((resource as any).content && String((resource as any).content).trim());
              const externalLink = fieldConfig.link ? videoUrl : null;
              // Content takes precedence — opens internal detail page; else external link
              const linkUrl = hasContent ? `/resources/${categorySlug}/${resource.slug}` : externalLink;
              const isInternal = hasContent;
              const thumbnail = fieldConfig.thumbnail
                ? getVideoThumbnail(videoUrl, (resource as any).thumbnail_url)
                : null;
              const isVideoLike = !!externalLink && !isInternal && !!getYouTubeId(externalLink);
              const linked = (fieldConfig.linked !== false && !!linkUrl) || hasContent;

              const wrapperClass = "block h-full group";
              const isList = view !== 'grid';
              const trackResourceOpen = () => {
                void trackEvent('resource_view', {
                  entity_type: 'resource',
                  entity_id: resource.id,
                  metadata: { title: resource.title, type: 'link', category: categorySlug },
                });
              };
              const openLinkedResource = () => {
                if (!linked || !linkUrl) return;
                trackResourceOpen();
                window.open(linkUrl, '_blank', 'noopener,noreferrer');
              };
              const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
                if (!linked || !linkUrl) return;
                if ((event.target as HTMLElement).closest('a,button')) return;
                openLinkedResource();
              };
              const handleResourceLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
                event.stopPropagation();
                trackResourceOpen();
              };
              const cardInner = (
                <Card
                  onClick={handleCardClick}
                  className={cn(
                  "h-full overflow-hidden transition-shadow",
                  view === 'grid' ? 'flex flex-col' : '',
                  linked && 'cursor-pointer hover:shadow-peach-glow'
                )}>
                  {isList ? (
                    <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                      {/* Left: thumbnail or title fallback */}
                      <div className="relative shrink-0 w-24 sm:w-48 aspect-video bg-muted overflow-hidden rounded-md flex items-center justify-center">
                        {fieldConfig.thumbnail && thumbnail ? (
                          <>
                            <img
                              src={thumbnail}
                              alt={resource.title}
                              loading="lazy"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                            {isVideoLike && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                <PlayCircle className="h-10 w-10 text-white drop-shadow-lg" />
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="px-2 text-center text-sm font-semibold text-foreground line-clamp-3">
                            {resource.title}
                          </span>
                        )}
                      </div>
                      {/* Right: title + description + meta */}
                      <div className="flex-1 min-w-0">
                        {fieldConfig.title !== false && (
                          linked && linkUrl ? (
                            <a
                              href={linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={handleResourceLinkClick}
                              className="block text-foreground no-underline hover:text-primary transition-colors"
                            >
                              <h3 className="text-xl font-semibold line-clamp-2">{resource.title}</h3>
                            </a>
                          ) : (
                            <h3 className="text-xl font-semibold text-foreground line-clamp-2">{resource.title}</h3>
                          )
                        )}
                        {fieldConfig.description && resource.description && (
                          <>
                            <p className={cn("mt-1 text-sm text-muted-foreground", expandedDescs[resource.id] ? "" : "line-clamp-3")}>{resource.description}</p>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleDesc(resource.id); }}
                              className="mt-1 text-xs font-medium text-primary hover:underline"
                            >
                              {expandedDescs[resource.id] ? "Show less" : "Read more"}
                            </button>
                          </>
                        )}
                        {fieldConfig.notes && (resource as any).notes && (
                          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{(resource as any).notes}</p>
                        )}
                        {resource.r_resource_files && resource.r_resource_files.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {resource.r_resource_files.filter(f => f.file_url).map((file) => (
                              <Button key={file.id} variant="outline" size="sm" className="gap-2" asChild>
                                <a
                                  href={file.file_url!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={file.is_downloadable ?? true}
                                  onClick={(e) => {
                                    e.stopPropagation();
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
                      </div>
                    </div>
                  ) : (
                    <>
                      {fieldConfig.thumbnail && (thumbnail || isVideoLike) && (
                        <div className="relative w-full aspect-video bg-muted overflow-hidden">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={resource.title}
                              loading="lazy"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <PlayCircle className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          {isVideoLike && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                              <PlayCircle className="h-14 w-14 text-white drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                      )}
                      <CardHeader className="p-3 sm:p-4 pb-2">
                        {fieldConfig.title !== false && (
                          linked && linkUrl ? (
                            <a
                              href={linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={handleResourceLinkClick}
                              className="block text-foreground no-underline hover:text-primary transition-colors"
                            >
                              <CardTitle className="text-base sm:text-lg line-clamp-2">{resource.title}</CardTitle>
                            </a>
                          ) : (
                            <CardTitle className="text-base sm:text-lg line-clamp-2">{resource.title}</CardTitle>
                          )
                        )}
                        {fieldConfig.description && resource.description && (
                          <>
                            <CardDescription className={cn("mt-1 text-sm", expandedDescs[resource.id] ? "" : "line-clamp-2")}>
                              {resource.description}
                            </CardDescription>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleDesc(resource.id); }}
                              className="mt-1 text-xs font-medium text-primary hover:underline self-start"
                            >
                              {expandedDescs[resource.id] ? "Show less" : "Read more"}
                            </button>
                          </>
                        )}
                      </CardHeader>
                      {(fieldConfig.notes || (resource.r_resource_files && resource.r_resource_files.length > 0)) && (
                        <CardContent className="flex-1 overflow-hidden pt-0">
                          {fieldConfig.notes && (resource as any).notes && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(resource as any).notes}</p>
                          )}
                          {resource.r_resource_files && resource.r_resource_files.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {resource.r_resource_files.filter(f => f.file_url).map((file) => (
                                <Button key={file.id} variant="outline" size="sm" className="gap-2" asChild>
                                  <a
                                    href={file.file_url!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={file.is_downloadable ?? true}
                                    onClick={(e) => {
                                      e.stopPropagation();
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
                        </CardContent>
                      )}
                    </>
                  )}
                </Card>
              );

              return <div key={resource.id} className={wrapperClass}>{cardInner}</div>;
            })
          ) : (
            <p className="text-muted-foreground">No resources match the selected filters.</p>
          )}
        </div>
      </main>
    </PageLayout>
  );
}
