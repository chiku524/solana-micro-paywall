/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  // Disable static optimization for dynamic routes in export mode
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;