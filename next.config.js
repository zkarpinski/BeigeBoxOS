/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: false,
  // Ensure static assets under public/ are available at /
  assetPrefix: '',
};

module.exports = nextConfig;
