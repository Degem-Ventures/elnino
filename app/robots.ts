import type { MetadataRoute } from 'next';

const siteUrl = 'https://www.elnino.co.ke';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
