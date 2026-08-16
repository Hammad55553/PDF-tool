const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  // Disable the service worker in dev (localhost has no HTTPS, so the SW's
  // CacheStorage call throws a SecurityError and crashes the page). PWA stays
  // fully enabled in production builds, where HTTPS is present.
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'pdfjs-dist', 'canvas', 'pdf-lib'],
  },
  webpack: (config) => {
    // canvas is a native module used by pdfjs-dist on the server for rasterization.
    // Avoid bundling it on the client (it's only used in Node API routes).
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = withPWA(nextConfig);
