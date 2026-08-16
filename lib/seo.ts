/**
 * lib/seo.ts — central SEO config for PDForo.
 *
 * Change SITE_URL to your real domain once you buy it (pdforo.com). Everything
 * else (sitemap, robots, Open Graph, canonical URLs) reads from here.
 */

export const SITE = {
  name: 'PDForo',
  // Full brand line used in <title> template and OG.
  tagline: 'Free Online PDF Tools',
  description:
    'PDForo is a free online PDF toolkit — merge, split, compress, convert (PDF to Word, Excel, JPG), watermark, protect and unlock PDF files. Fast, private, no signup needed.',
  // Live domain (GitHub Student Pack free domain via name.com).
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://pdforo.app',
  twitter: '@pdforo',
  keywords: [
    'PDForo',
    'PDF tools',
    'merge PDF',
    'split PDF',
    'compress PDF',
    'PDF to Word',
    'PDF to JPG',
    'JPG to PDF',
    'Word to PDF',
    'Excel to PDF',
    'PDF to Excel',
    'watermark PDF',
    'protect PDF',
    'unlock PDF',
    'remove background',
    'free PDF converter online',
    'online PDF editor',
  ],
};

export function absoluteUrl(path = ''): string {
  const base = SITE.url.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
