import { withSentryConfig } from '@sentry/nextjs';

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

// Only wrap with Sentry if DSN is configured
const sentryOptions = {
  silent: !process.env.NEXT_PUBLIC_SENTRY_DSN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;

