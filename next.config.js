/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude seed.ts from build
    config.module.rules.push({
      test: /prisma\/seed\.ts$/,
      use: 'ignore-loader',
    });
    return config;
  },
};

module.exports = nextConfig;