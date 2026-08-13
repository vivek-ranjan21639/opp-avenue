import { BookOpen, Sparkles, ExternalLink } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useResourceCategories, useFeaturedResources } from "@/hooks/useResources";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import PageLayout from "@/components/PageLayout";

const Resources = () => {
  const { data: categories = [], isLoading: loadingCategories } = useResourceCategories();
  const { data: featuredResources = [], isLoading: loadingFeatured } = useFeaturedResources();

  return (
    <PageLayout prerenderReady={!loadingCategories && !loadingFeatured}>
      <SEO
        title="Career Resources"
        description="Explore our collection of helpful resources to advance your career. Career guides, resume templates, interview tips, and more."
        canonical="/resources"
      />

      <main className="max-w-[864px] mx-auto px-4 pt-8 pb-12">
        <h1 className="sr-only">Resources</h1>

        {!loadingFeatured && featuredResources.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-lg md:text-2xl font-bold text-foreground">What's New</h2>
            </div>
            <div className="space-y-2">
              {featuredResources.map((resource) => (
                <div key={resource.id} className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-primary flex-shrink-0" />
                  <Link
                    to={`/resources/${resource.r_categories?.slug || 'all'}#${resource.slug}`}
                    className="text-primary hover:underline text-base font-medium"
                  >
                    {resource.title}
                    {resource.whats_new && (
                      <span className="text-muted-foreground font-normal ml-2 text-sm">— {resource.whats_new}</span>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingCategories ? (
          <p className="text-muted-foreground">Loading categories...</p>
        ) : categories.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-5">
            {categories.map((category) => {
              const filled = !!category.is_filled;
              return (
                <Link key={category.id} to={`/resources/${category.slug}`}>
                  <Card
                    className={`cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 h-full ${
                      filled
                        ? 'bg-[hsl(217,91%,55%)] border-[hsl(217,91%,55%)] text-white hover:border-[hsl(217,91%,45%)]'
                        : 'hover:border-primary'
                    }`}
                  >
                    <CardHeader className="p-5">
                      <div className="flex items-center gap-3">
                        <BookOpen className={`w-8 h-8 flex-shrink-0 ${filled ? 'text-white' : 'text-primary'}`} />
                        <div>
                          <CardTitle className={`text-xl ${filled ? 'text-white' : ''}`}>{category.name}</CardTitle>
                          <CardDescription className={`mt-1 ${filled ? 'text-white/85' : ''}`}>
                            Browse all {category.name.toLowerCase()} resources
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">No resource categories available yet.</p>
        )}
      </main>
    </PageLayout>
  );
};

export default Resources;
