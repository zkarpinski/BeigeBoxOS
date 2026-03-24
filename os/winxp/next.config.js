const baseConfig = require('@retro-web/config/next');

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...baseConfig,
  transpilePackages: ['@retro-web/app-pdf-reader'],
  // WinXP-specific overrides go here
  //
  // Dev: use `pnpm dev` (Webpack). Turbopack (`pnpm dev:turbo`) is faster but can throw
  // ENOENT on `_buildManifest.js.tmp.*` during hot reload on macOS — a known race.
};

module.exports = nextConfig;
