// Skip Sentry for Cloudflare Pages builds to avoid module resolution issues
// Sentry tries to load 'next/constants' before Next.js is fully available during build
const skipSentry = process.env.SKIP_SENTRY === 'true';

// Skip setupDevPlatform during builds - it requires wrangler which isn't needed for builds
// Only needed for local development with 'next dev'
const isDevelopment = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 15 optimizations
  // - React 19 support enabled
  // - Improved server components and streaming
  // - Enhanced caching strategies
  
  // Disable prefetching globally to prevent 503 errors on Cloudflare Pages
  // Prefetching can cause issues when server components fail during build/prefetch
  // This is handled via prefetch={false} on individual Link components
  // and by ensuring server components handle errors gracefully
  
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
    
    // Fix for Edge Runtime: Resolve Node.js modules to empty stubs or browser alternatives
    // Some wallet adapters try to import Node.js modules that don't exist in Edge Runtime
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      util: false,
      path: false,
      fs: false,
      net: false,
      tls: false,
      os: false,
      http: false,
      https: false,
      zlib: false,
      url: false,
      assert: false,
      buffer: false,
      process: false,
    };

    // Ignore problematic modules that use Node.js APIs
    config.resolve.alias = {
      ...config.resolve.alias,
      // These adapters use Node.js APIs and should only run client-side
      '@toruslabs/eccrypto': false,
      '@keystonehq/sol-keyring': false,
    };

    // Exclude problematic packages from being processed
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        // Exclude wallet adapters that use Node.js APIs from server bundle
        '@toruslabs/eccrypto',
        '@keystonehq/sol-keyring',
        '@keystonehq/bc-ur-registry',
        'cipher-base',
        'hash-base',
        'create-hash',
        'bs58check',
      ];
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

// Skip setupDevPlatform during builds - it requires wrangler which isn't installed during builds
// setupDevPlatform is only needed for local development with 'next dev'
// During Cloudflare Pages builds (when SKIP_SENTRY is set), we skip this entirely

// Skip Sentry wrapper for Cloudflare builds to avoid module loading errors
// Sentry causes build failures because it tries to access Next.js modules
// before they're fully loaded during the Cloudflare build process
if (skipSentry && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  console.log('ℹ️ Skipping Sentry for Cloudflare Pages build');
}

// Export config - Sentry wrapping is skipped for Cloudflare builds
export default nextConfig;

