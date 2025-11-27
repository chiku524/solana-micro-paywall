import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// Skip Sentry for Cloudflare Pages builds to avoid module resolution issues
// Sentry tries to load 'next/constants' before Next.js is fully available during build
const skipSentry = process.env.SKIP_SENTRY === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disabled typedRoutes due to external URL compatibility issues
  // experimental: {
  //   typedRoutes: true,
  // },
  // Cloudflare Pages compatibility
  // Remove output: 'standalone' - Cloudflare Pages handles Next.js natively
  // output: 'standalone' is not compatible with Cloudflare Pages
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Code splitting optimizations
  webpack: (config, { isServer, dev }) => {
    // Disable webpack cache for production builds to avoid large cache files
    if (!dev) {
      config.cache = false;
    }
    
    if (!isServer) {
      // Optimize chunks for better code splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Solana Web3.js in separate chunk (large library)
            solana: {
              name: 'solana',
              test: /[\\/]node_modules[\\/]@solana[\\/]/,
              chunks: 'all',
              priority: 30,
            },
          },
        },
      };
    }
    return config;
  },
};

// Setup Cloudflare dev platform for local development
if (process.env.NODE_ENV === 'development') {
  setupDevPlatform().catch(console.error);
}

// Skip Sentry wrapper for Cloudflare builds to avoid module loading errors
// Sentry causes build failures because it tries to access Next.js modules
// before they're fully loaded during the Cloudflare build process
if (skipSentry && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  console.log('ℹ️ Skipping Sentry for Cloudflare Pages build');
}

// Export config - Sentry wrapping is skipped for Cloudflare builds
export default nextConfig;

