/**
 * Writes out/_routes.json for Cloudflare Pages so only /api/* invokes Functions.
 * Run after next build (e.g. "postbuild": "node scripts/write-cloudflare-routes.js").
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');
const routesPath = path.join(outDir, '_routes.json');

const routes = {
  version: 1,
  include: ['/api/*'],
  exclude: [],
};

if (!fs.existsSync(outDir)) {
  console.warn('scripts/write-cloudflare-routes.js: out/ not found (run next build first)');
  process.exit(0);
}

fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2) + '\n');
console.log('Wrote out/_routes.json for Cloudflare Pages');
