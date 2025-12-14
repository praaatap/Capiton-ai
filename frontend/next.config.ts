import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,

  // Environment variables accessible on client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Allow images from external domains if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable strict mode for better error catching
  reactStrictMode: true,
};

export default nextConfig;
