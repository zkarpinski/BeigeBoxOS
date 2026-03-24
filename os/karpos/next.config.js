const baseConfig = require('@retro-web/config/next');

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...baseConfig,
  transpilePackages: ['@retro-web/core', '@retro-web/app-pdf-reader'],
};

module.exports = nextConfig;
