const baseConfig = require('@retro-web/config/next');

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...baseConfig,
  // Win98-specific overrides go here
};

module.exports = nextConfig;
