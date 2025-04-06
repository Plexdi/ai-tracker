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
      allowedOrigins: ['localhost:3000', 'yoursite.vercel.app']
    },
  },
};

module.exports = nextConfig;
