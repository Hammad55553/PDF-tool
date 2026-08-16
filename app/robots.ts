import { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

/**
 * robots.txt — allow all crawlers (including AI answer-engine bots like
 * GPTBot, ClaudeBot, PerplexityBot) to index the whole site, and point them
 * to the sitemap. Available at /robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep auth/checkout callbacks + API out of the index.
        disallow: ['/api/', '/auth/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
