import PageLayout from '@/components/PageLayout';
import SEO from '@/components/SEO';

const TermsConditions = () => {
  return (
    <PageLayout className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <SEO 
        title="Terms & Conditions"
        description="Read the terms and conditions for using Opp Avenue. Understand your rights and responsibilities as a user."
        canonical="/terms"
      />

      <main className="container mx-auto px-4 pt-4 pb-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <h1 className="text-4xl font-bold mb-4">Terms and Conditions</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">1. Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using Opp Avenue, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">2. Use License</h2>
            <p className="text-muted-foreground">
              Permission is granted to temporarily access the materials on Opp Avenue for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on Opp Avenue</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">3. User Accounts</h2>
            <p className="text-muted-foreground">
              When you create an account with us, you must provide accurate, complete, and current information at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">4. Job Listings</h2>
            <p className="text-muted-foreground">
              Opp Avenue provides a platform for employers to post job listings and for job seekers to find opportunities. We do not guarantee the accuracy, completeness, or quality of any job listings. Users are responsible for verifying the legitimacy of job postings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">5. Prohibited Uses</h2>
            <p className="text-muted-foreground">
              You may not use Opp Avenue:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              In no event shall Opp Avenue or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Opp Avenue.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">7. Modifications</h2>
            <p className="text-muted-foreground">
              Opp Avenue may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">8. Contact Information</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms and Conditions, please contact us at legal@oppavenue.com
            </p>
          </section>
        </div>
      </main>
    </PageLayout>
  );
};

export default TermsConditions;
