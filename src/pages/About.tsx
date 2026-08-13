import PageLayout from '@/components/PageLayout';
import SEO from '@/components/SEO';
import OrganizationSchema from '@/components/seo/OrganizationSchema';
import SitePageContent from '@/components/SitePageContent';

const About = () => {
  return (
    <PageLayout className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <SEO
        title="About Us"
        description="Learn about Opp Avenue."
        canonical="/about"
      />
      <OrganizationSchema />

      <main className="container mx-auto px-4 pt-4 pb-12 max-w-6xl">
        <SitePageContent
          slug="about"
          fallback={
            <div className="text-center py-20 text-muted-foreground">
              <h1 className="text-2xl font-semibold mb-2">About Opp Avenue</h1>
              <p className="text-sm">Content coming soon.</p>
            </div>
          }
        />
      </main>
    </PageLayout>
  );
};

export default About;
