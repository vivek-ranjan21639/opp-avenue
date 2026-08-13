import PageLayout from '@/components/PageLayout';
import SEO from '@/components/SEO';

const Disclaimer = () => {
  return (
    <PageLayout className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <SEO title="Disclaimer" description="Important disclaimers and notices about using Opp Avenue job portal." canonical="/disclaimer" />

      <main className="container mx-auto px-4 pt-4 pb-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <h1 className="text-4xl font-bold mb-4">Disclaimer</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">General Information</h2>
            <p className="text-muted-foreground">
              The information provided by Opp Avenue on our website is for general informational purposes only. All information on the site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">External Links Disclaimer</h2>
            <p className="text-muted-foreground">
              Our website may contain links to other websites or content belonging to or originating from third parties or links to websites and features in banners or other advertising. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us.
            </p>
            <p className="text-muted-foreground">
              We do not warrant, endorse, guarantee, or assume responsibility for the accuracy or reliability of any information offered by third-party websites linked through the site or any website or feature linked in any banner or other advertising.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">Job Listings Disclaimer</h2>
            <p className="text-muted-foreground">
              Opp Avenue acts as a platform connecting job seekers with employers. We do not:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Verify the accuracy of job postings</li>
              <li>Guarantee the legitimacy of employers or job offers</li>
              <li>Endorse any particular employer or job listing</li>
              <li>Guarantee employment or interview opportunities</li>
              <li>Take responsibility for the hiring process or employment outcomes</li>
            </ul>
            <p className="text-muted-foreground">
              Users are advised to conduct their own due diligence and research before applying for any position or engaging with any employer through our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">Professional Disclaimer</h2>
            <p className="text-muted-foreground">
              The site cannot and does not contain professional career advice. The career information is provided for general informational and educational purposes only and is not a substitute for professional advice.
            </p>
            <p className="text-muted-foreground">
              Accordingly, before taking any actions based upon such information, we encourage you to consult with the appropriate professionals. We do not provide any kind of career advice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">Errors and Omissions Disclaimer</h2>
            <p className="text-muted-foreground">
              While we have made every attempt to ensure that the information contained in this site has been obtained from reliable sources, Opp Avenue is not responsible for any errors or omissions or for the results obtained from the use of this information.
            </p>
            <p className="text-muted-foreground">
              All information in this site is provided "as is", with no guarantee of completeness, accuracy, timeliness or of the results obtained from the use of this information, and without warranty of any kind, express or implied.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">Fair Use Disclaimer</h2>
            <p className="text-muted-foreground">
              This site may contain copyrighted material, the use of which has not always been specifically authorized by the copyright owner. We believe this constitutes a "fair use" of any such copyrighted material as provided for in section 107 of the US Copyright Law.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Disclaimer, please contact us at legal@oppavenue.com
            </p>
          </section>
        </div>
      </main>
    </PageLayout>
  );
};

export default Disclaimer;
