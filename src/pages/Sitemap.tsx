import { useNavigate } from 'react-router-dom';
import { Home, Shield, Mail } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import PageLayout from '@/components/PageLayout';
import SEO from '@/components/SEO';

const Sitemap = () => {
  const navigate = useNavigate();

  const siteStructure = [
    {
      category: 'Main Pages',
      icon: Home,
      pages: [
        { name: 'Home', path: '/', description: 'Browse job listings and opportunities' },
        { name: 'About', path: '/about', description: 'Learn more about Opp Avenue' },
        { name: 'Resources', path: '/resources', description: 'Helpful resources for your career' },
        { name: 'Blogs', path: '/blogs', description: 'Latest news and insights' },
        { name: 'Advertise', path: '/advertise', description: 'Advertise your job openings with us' },
      ]
    },
    {
      category: 'Legal & Policies',
      icon: Shield,
      pages: [
        { name: 'Privacy Policy', path: '/privacy-policy', description: 'How we handle your data' },
        { name: 'Terms & Conditions', path: '/terms', description: 'Terms of service and usage' },
        { name: 'Disclaimer', path: '/disclaimer', description: 'Important disclaimers and notices' },
        { name: 'Cookie Policy', path: '/cookie-policy', description: 'How we use cookies' },
      ]
    },
    {
      category: 'Contact & Support',
      icon: Mail,
      pages: [
        { name: 'Contact Us', path: '/contact', description: 'Get in touch with our team' },
        { name: 'Sitemap', path: '/sitemap', description: 'Navigate our website structure' },
      ]
    }
  ];

  return (
    <PageLayout className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <SEO title="Sitemap" description="Navigate through all pages and sections of Opp Avenue." canonical="/sitemap" />

      <main className="container mx-auto px-4 pt-4 pb-12 max-w-6xl">
        <div className="space-y-12">
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              Sitemap
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Navigate through all pages and sections of Opp Avenue
            </p>
          </section>

          <div className="space-y-8">
            {siteStructure.map((section, index) => (
              <Card key={index} className="border-border/50 shadow-lg">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{section.category}</CardTitle>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {section.pages.map((page, pageIndex) => (
                      <div
                        key={pageIndex}
                        onClick={() => navigate(page.path)}
                        className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                      >
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                          {page.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {page.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </PageLayout>
  );
};

export default Sitemap;
