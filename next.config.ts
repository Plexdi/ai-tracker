import type { NextConfig } from "next";

// next.config.js
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure all pages are included in static generation
  output: 'standalone',
  // Enable all necessary experimental features
  experimental: {
    // Used by Next 15
    serverActions: {
      allowedOrigins: ['localhost:3000', 'ai-tracker.vercel.app']
    },
  },
  // Configure images
  images: {
    domains: ['lh3.googleusercontent.com', 'images.unsplash.com'],
  },
  // Configure headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
