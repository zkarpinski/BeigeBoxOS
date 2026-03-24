/**
 * Builds 1200×630 Open Graph images for the apex landing and KarpOS.
 * Uses the KarpOS fish mark (android-chrome-512x512.png) + neo-brutalist frame.
 *
 * Run from repo root: pnpm generate-og-images
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const W = 1200;
const H = 630;
const LIME = '#bef264';
const BG = { r: 12, g: 12, b: 14, alpha: 1 };

const logoPath = join(ROOT, 'os/karpos/public/android-chrome-512x512.png');

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function frameAndTextSvg({ title, line2, line3 }) {
  const t = escapeXml(title);
  const l2 = escapeXml(line2);
  const l3 = escapeXml(line3);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}" fill="none" stroke="${LIME}" stroke-width="10"/>
  <rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="#27272a" stroke-width="4"/>
  <text x="520" y="248" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif" font-weight="800" font-size="56" fill="#fafafa">${t}</text>
  <text x="520" y="318" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif" font-weight="700" font-size="34" fill="${LIME}">${l2}</text>
  <text x="520" y="388" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif" font-weight="500" font-size="26" fill="#a1a1aa">${l3}</text>
</svg>`,
    'utf8',
  );
}

async function buildOne({ outPath, title, line2, line3 }) {
  const logoSize = 340;
  const logoTop = Math.round((H - logoSize) / 2);
  const logoLeft = 72;

  const logoBuf = await sharp(readFileSync(logoPath))
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const overlay = await sharp(frameAndTextSvg({ title, line2, line3 }))
    .resize(W, H)
    .png()
    .toBuffer();

  await sharp({
    create: { width: W, height: H, channels: 4, background: BG },
  })
    .composite([
      { input: logoBuf, left: logoLeft, top: logoTop },
      { input: overlay, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log('Wrote', outPath);
}

const landingOut = join(ROOT, 'landing/og-image.png');
const karposOut = join(ROOT, 'os/karpos/public/og-image.png');

await buildOne({
  outPath: landingOut,
  title: 'Zach Karpinski',
  line2: 'zkarpinski.com',
  line3: 'KarpOS · Win98 · WinXP in your browser',
});

await buildOne({
  outPath: karposOut,
  title: 'KarpOS',
  line2: 'karpos.zkarpinski.com',
  line3: 'Neo-brutalist desktop in your browser',
});
