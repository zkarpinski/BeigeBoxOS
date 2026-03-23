const baseConfig = require('@retro-web/config/next');

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...baseConfig,
  transpilePackages: ['@retro-web/core'],
};

module.exports = nextConfig;
