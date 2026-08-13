import PageLayout from '@/components/PageLayout';
import SEO from '@/components/SEO';

const CookiePolicy = () => {
  return (
    <PageLayout className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <SEO title="Cookie Policy" description="Learn how Opp Avenue uses cookies to enhance your browsing experience." canonical="/cookie-policy" />

      <main className="container mx-auto px-4 pt-4 pb-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">What Are Cookies</h2>
            <p className="text-muted-foreground">
              Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the website or a third-party to recognize you and make your next visit easier and the website more useful to you.
            </p>
            <p className="text-muted-foreground">
              Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your personal computer or mobile device when you go offline, while session cookies are deleted as soon as you close your web browser.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">How We Use Cookies</h2>
            <p className="text-muted-foreground">
              When you use and access Opp Avenue, we may place a number of cookies files in your web browser. We use cookies for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To enable certain functions of the website</li>
              <li>To provide analytics</li>
              <li>To store your preferences</li>
              <li>To enable advertisements delivery, including behavioral advertising</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold mt-6">Essential Cookies</h3>
            <p className="text-muted-foreground">
              These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms.
            </p>

            <h3 className="text-xl font-semibold mt-6">Analytics Cookies</h3>
            <p className="text-muted-foreground">
              These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.
            </p>

            <h3 className="text-xl font-semibold mt-6">Functionality Cookies</h3>
            <p className="text-muted-foreground">
              These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.
            </p>

            <h3 className="text-xl font-semibold mt-6">Advertising Cookies</h3>
            <p className="text-muted-foreground">
              These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">Third-Party Cookies</h2>
            <p className="text-muted-foreground">
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements on and through the website, and so on.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">Your Choices Regarding Cookies</h2>
            <p className="text-muted-foreground">
              If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer.
            </p>
            <p className="text-muted-foreground">
              Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit www.aboutcookies.org or www.allaboutcookies.org.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">More Information</h2>
            <p className="text-muted-foreground">
              For more information about cookies and how we use them, please contact us at privacy@oppavenue.com
            </p>
          </section>
        </div>
      </main>
    </PageLayout>
  );
};

export default CookiePolicy;
