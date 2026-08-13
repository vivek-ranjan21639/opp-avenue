import { Helmet } from 'react-helmet-async';

interface JobPostingSchemaProps {
  title: string;
  description: string;
  companyName: string;
  companyLogo?: string;
  locations?: { city: string; state?: string; country?: string }[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  jobType?: string;
  workMode?: string;
  datePosted: string;
  validThrough?: string;
  jobId: string;
}

const JobPostingSchema = ({
  title,
  description,
  companyName,
  companyLogo,
  locations = [],
  salaryMin,
  salaryMax,
  currency = 'INR',
  jobType,
  workMode,
  datePosted,
  validThrough,
  jobId,
}: JobPostingSchemaProps) => {
  const employmentType = jobType?.toUpperCase().replace('-', '_') || 'FULL_TIME';
  
  const jobLocation = locations.length > 0
    ? locations.map((loc) => ({
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: loc.city,
          addressRegion: loc.state || undefined,
          addressCountry: loc.country || 'India',
        },
      }))
    : workMode === 'Remote'
    ? {
        '@type': 'VirtualLocation',
      }
    : undefined;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    identifier: {
      '@type': 'PropertyValue',
      name: companyName,
      value: jobId,
    },
    datePosted,
    hiringOrganization: {
      '@type': 'Organization',
      name: companyName,
      logo: companyLogo || undefined,
    },
    employmentType,
  };

  if (jobLocation) {
    schema.jobLocation = jobLocation;
  }

  if (workMode === 'Remote') {
    schema.jobLocationType = 'TELECOMMUTE';
  }

  if (salaryMin && salaryMax) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency,
      value: {
        '@type': 'QuantitativeValue',
        minValue: salaryMin,
        maxValue: salaryMax,
        unitText: 'YEAR',
      },
    };
  }

  if (validThrough) {
    schema.validThrough = validThrough;
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default JobPostingSchema;
