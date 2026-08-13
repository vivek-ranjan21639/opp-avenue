import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/siteUrl';

interface BlogPostingSchemaProps {
  title: string;
  description: string;
  slug: string;
  authorName?: string;
  authorUrl?: string;
  publishedDate?: string;
  modifiedDate?: string;
  thumbnailUrl?: string;
  readTimeMinutes?: number;
}

const BlogPostingSchema = ({
  title,
  description,
  slug,
  authorName,
  authorUrl,
  publishedDate,
  modifiedDate,
  thumbnailUrl,
  readTimeMinutes,
}: BlogPostingSchemaProps) => {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: `${SITE_URL}/blog/${slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Opp Avenue',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  };

  if (authorName) {
    schema.author = {
      '@type': 'Person',
      name: authorName,
      url: authorUrl || undefined,
    };
  }

  if (publishedDate) {
    schema.datePublished = publishedDate;
  }

  if (modifiedDate) {
    schema.dateModified = modifiedDate;
  } else if (publishedDate) {
    schema.dateModified = publishedDate;
  }

  if (thumbnailUrl) {
    schema.image = thumbnailUrl;
  }

  if (readTimeMinutes) {
    schema.timeRequired = `PT${readTimeMinutes}M`;
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default BlogPostingSchema;
