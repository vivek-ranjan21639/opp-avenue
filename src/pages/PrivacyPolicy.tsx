import PageLayout from '@/components/PageLayout';
import SEO from '@/components/SEO';

const PrivacyPolicy = () => {
  return (
    <PageLayout className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <SEO 
        title="Privacy Policy"
        description="Learn how Opp Avenue handles and protects your personal data. Our commitment to your privacy and data security."
        canonical="/privacy-policy"
      />

      <main className="container mx-auto px-4 pt-4 pb-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to Opp Avenue. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">2. Information We Collect</h2>
            <p className="text-muted-foreground">
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Identity Data: includes first name, last name, username or similar identifier</li>
              <li>Contact Data: includes email address and telephone numbers</li>
              <li>Technical Data: includes internet protocol (IP) address, browser type and version</li>
              <li>Usage Data: includes information about how you use our website and services</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">3. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information to improve our service</li>
              <li>To monitor the usage of our service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">4. Data Security</h2>
            <p className="text-muted-foreground">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">5. Your Legal Rights</h2>
            <p className="text-muted-foreground">
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">6. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this privacy policy, please contact us at privacy@oppavenue.com
            </p>
          </section>
        </div>
      </main>
    </PageLayout>
  );
};

export default PrivacyPolicy;
