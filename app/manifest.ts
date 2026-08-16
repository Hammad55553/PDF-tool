import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PDForo — Free Online PDF Tools',
    short_name: 'PDForo',
    description:
      'Free online PDF tools: merge, split, compress, convert, watermark, protect & unlock PDF files. Fast and private.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#3A42EA',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
