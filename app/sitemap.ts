import { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/tools';
import { SITE } from '@/lib/seo';

/**
 * Dynamic sitemap.xml — lists the homepage, pricing, and every tool page so
 * search engines can discover and index all of them. Available at /sitemap.xml.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = SITE.url.replace(/\/$/, '');

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const toolPages: MetadataRoute.Sitemap = TOOLS.map((t) => ({
    url: `${base}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticPages, ...toolPages];
}
