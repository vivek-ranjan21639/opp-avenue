import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/siteUrl';

const OrganizationSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Opp Avenue',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Your trusted platform for discovering exciting career opportunities and connecting talented professionals with leading companies.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-234-567-890',
      contactType: 'customer service',
      email: 'contact@oppavenue.com',
      availableLanguage: ['English'],
    },
    sameAs: [
      'https://www.linkedin.com/company/oppavenue',
      'https://twitter.com/oppavenue',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Business Street, Suite 100',
      addressLocality: 'New York',
      addressRegion: 'NY',
      postalCode: '10001',
      addressCountry: 'US',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default OrganizationSchema;
