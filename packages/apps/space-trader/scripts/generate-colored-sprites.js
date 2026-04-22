#!/usr/bin/env node
/**
 * Generates multi-color ship sprites by:
 * 1. Parsing outline pixel coordinates from ShipSprites.tsx
 * 2. Flood-filling interiors using 4-connected fill from borders
 * 3. Assigning colors based on per-ship palettes with vertical gradient zones
 * 4. Writing back to ShipSprites.tsx with multiple <g> color groups
 *
 * Usage: node scripts/generate-colored-sprites.js
 */

const fs = require('fs');
const path = require('path');

const SPRITES_FILE = path.join(__dirname, '..', 'src', 'assets', 'ships', 'ShipSprites.tsx');

// ── Ship color palettes ──────────────────────────────────────────────────────
// Each ship gets 4 interior colors: highlight (top), body (mid), shadow (bottom), accent (cockpit/engine)
// Derived from the SHIP_COLORS in EncounterModal.tsx + reference screenshots

const SHIP_PALETTES = [
  {
    // 0 Flea - light blue
    name: 'Flea',
    highlight: '#aaccee',
    body: '#88aadd',
    shadow: '#5577aa',
    accent: '#ccddff',
  },
  {
    // 1 Gnat - green
    name: 'Gnat',
    highlight: '#99dd99',
    body: '#77bb77',
    shadow: '#448844',
    accent: '#bbeeaa',
  },
  {
    // 2 Firefly - gold
    name: 'Firefly',
    highlight: '#eebb55',
    body: '#ddaa44',
    shadow: '#aa7722',
    accent: '#ffdd77',
  },
  {
    // 3 Mosquito - orange
    name: 'Mosquito',
    highlight: '#dd8855',
    body: '#cc7744',
    shadow: '#995533',
    accent: '#eeaa66',
  },
  {
    // 4 Bumblebee - yellow
    name: 'Bumblebee',
    highlight: '#eedd66',
    body: '#ddcc44',
    shadow: '#aa9922',
    accent: '#ffee88',
  },
  {
    // 5 Beetle - teal
    name: 'Beetle',
    highlight: '#77cc99',
    body: '#55aa77',
    shadow: '#338855',
    accent: '#99ddbb',
  },
  {
    // 6 Hornet - blue
    name: 'Hornet',
    highlight: '#7799dd',
    body: '#5577cc',
    shadow: '#334499',
    accent: '#99bbee',
  },
  {
    // 7 Grasshopper - olive-green
    name: 'Grasshopper',
    highlight: '#99cc77',
    body: '#77aa55',
    shadow: '#557733',
    accent: '#bbdd88',
  },
  {
    // 8 Termite - brown
    name: 'Termite',
    highlight: '#ccaa88',
    body: '#aa8866',
    shadow: '#886644',
    accent: '#ddbb99',
  },
  {
    // 9 Wasp - sage
    name: 'Wasp',
    highlight: '#bbcc99',
    body: '#99aa77',
    shadow: '#778855',
    accent: '#ccddaa',
  },
];

// ── Parse sprite data from TSX ───────────────────────────────────────────────

function parseSpriteBlocks(source) {
  const sprites = [];
  // Match each sprite component: export const XxxSprite ... </svg> );
  const spriteRegex =
    /export const (\w+Sprite):\s*React\.FC<ShipSpriteProps>\s*=\s*\(\{[^}]*\}\)\s*=>\s*\(\s*<svg[^>]*viewBox="0 0 (\d+) (\d+)"[^>]*>[^]*?<\/svg>\s*\)/g;
  let match;
  while ((match = spriteRegex.exec(source)) !== null) {
    const name = match[1];
    const w = parseInt(match[2]);
    const h = parseInt(match[3]);
    const block = match[0];

    // Extract all rect coordinates
    const rects = [];
    const rectRegex = /<rect x=\{(\d+)\} y=\{(\d+)\} width=\{1\} height=\{1\}/g;
    let rm;
    while ((rm = rectRegex.exec(block)) !== null) {
      rects.push({ x: parseInt(rm[1]), y: parseInt(rm[2]) });
    }

    sprites.push({ name, width: w, height: h, outlinePixels: rects });
  }
  return sprites;
}

// ── Flood-fill to find interior pixels ───────────────────────────────────────

const EMPTY = 0;
const OUTLINE = 1;
const EXTERIOR = 2;
const INTERIOR = 3;

function findInteriorPixels(width, height, outlinePixels) {
  // Create grid
  const grid = Array.from({ length: height }, () => new Uint8Array(width));

  // Mark outline pixels
  for (const { x, y } of outlinePixels) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[y][x] = OUTLINE;
    }
  }

  // Flood-fill from all border EMPTY cells (4-connected)
  const queue = [];
  for (let x = 0; x < width; x++) {
    if (grid[0][x] === EMPTY) {
      grid[0][x] = EXTERIOR;
      queue.push([x, 0]);
    }
    if (grid[height - 1][x] === EMPTY) {
      grid[height - 1][x] = EXTERIOR;
      queue.push([x, height - 1]);
    }
  }
  for (let y = 0; y < height; y++) {
    if (grid[y][0] === EMPTY) {
      grid[y][0] = EXTERIOR;
      queue.push([0, y]);
    }
    if (grid[y][width - 1] === EMPTY) {
      grid[y][width - 1] = EXTERIOR;
      queue.push([width - 1, y]);
    }
  }

  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx] === EMPTY) {
        grid[ny][nx] = EXTERIOR;
        queue.push([nx, ny]);
      }
    }
  }

  // All remaining EMPTY cells are interior
  const interiorPixels = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === EMPTY) {
        grid[y][x] = INTERIOR;
        interiorPixels.push({ x, y });
      }
    }
  }

  return { grid, interiorPixels };
}

// ── Classify interior pixels into color zones ────────────────────────────────

function classifyPixels(interiorPixels, width, height, grid) {
  if (interiorPixels.length === 0) return { highlight: [], body: [], shadow: [], accent: [] };

  // Find bounding box of all non-exterior pixels (outline + interior)
  let minY = height,
    maxY = 0,
    minX = width,
    maxX = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === OUTLINE || grid[y][x] === INTERIOR) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }

  const shipHeight = maxY - minY + 1;
  const shipWidth = maxX - minX + 1;

  const highlight = [];
  const body = [];
  const shadow = [];
  const accent = [];

  for (const { x, y } of interiorPixels) {
    const relY = (y - minY) / shipHeight; // 0 = top, 1 = bottom
    const relX = (x - minX) / shipWidth; // 0 = left, 1 = right

    // Accent: cockpit area (front-center region, roughly top 30% and center 40%)
    if (relY < 0.35 && relX > 0.3 && relX < 0.7) {
      accent.push({ x, y });
    }
    // Highlight: top third
    else if (relY < 0.33) {
      highlight.push({ x, y });
    }
    // Shadow: bottom third
    else if (relY > 0.66) {
      shadow.push({ x, y });
    }
    // Body: middle third
    else {
      body.push({ x, y });
    }
  }

  return { highlight, body, shadow, accent };
}

// ── Generate TSX output ──────────────────────────────────────────────────────

function generateRects(pixels, indent) {
  return pixels
    .map(({ x, y }) => `${indent}<rect x={${x}} y={${y}} width={1} height={1} />`)
    .join('\n');
}

function generateSpriteComponent(sprite, palette, zones) {
  const { name, width, height, outlinePixels } = sprite;
  const indent = '      ';

  let groups = '';

  // Interior fill groups render first (behind outlines)
  if (zones.body.length > 0) {
    groups += `    <g fill="${palette.body}">\n${generateRects(zones.body, indent)}\n    </g>\n`;
  }
  if (zones.highlight.length > 0) {
    groups += `    <g fill="${palette.highlight}">\n${generateRects(zones.highlight, indent)}\n    </g>\n`;
  }
  if (zones.shadow.length > 0) {
    groups += `    <g fill="${palette.shadow}">\n${generateRects(zones.shadow, indent)}\n    </g>\n`;
  }
  if (zones.accent.length > 0) {
    groups += `    <g fill="${palette.accent}">\n${generateRects(zones.accent, indent)}\n    </g>\n`;
  }

  // Outline group renders last (on top)
  groups += `    <g fill="#000000">\n${generateRects(outlinePixels, indent)}\n    </g>`;

  return `export const ${name}: React.FC<ShipSpriteProps> = ({ scale = 2, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${width} ${height}"
    width={${width} * scale}
    height={${height} * scale}
    shapeRendering="crispEdges"
    style={{ imageRendering: 'pixelated', ...style }}
    role="img"
    aria-label="${palette.name}"
  >
${groups}
  </svg>
);`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const source = fs.readFileSync(SPRITES_FILE, 'utf-8');
  const sprites = parseSpriteBlocks(source);

  if (sprites.length === 0) {
    console.error('No sprites found in', SPRITES_FILE);
    process.exit(1);
  }

  console.log(`Found ${sprites.length} sprites:`);

  const components = [];

  for (let i = 0; i < sprites.length; i++) {
    const sprite = sprites[i];
    const palette = SHIP_PALETTES[i] || SHIP_PALETTES[0];

    const { grid, interiorPixels } = findInteriorPixels(
      sprite.width,
      sprite.height,
      sprite.outlinePixels,
    );
    const zones = classifyPixels(interiorPixels, sprite.width, sprite.height, grid);

    const totalInterior =
      zones.highlight.length + zones.body.length + zones.shadow.length + zones.accent.length;
    console.log(
      `  ${sprite.name}: ${sprite.outlinePixels.length} outline + ${totalInterior} interior pixels (h:${zones.highlight.length} b:${zones.body.length} s:${zones.shadow.length} a:${zones.accent.length})`,
    );

    components.push(generateSpriteComponent(sprite, palette, zones));
  }

  // Extract the SHIP_SPRITES array from the original source
  const arrayMatch = source.match(/export const SHIP_SPRITES[\s\S]*?] as const;/);
  const shipSpritesArray = arrayMatch ? arrayMatch[0] : '';

  const output = `import React from 'react';

interface ShipSpriteProps {
  scale?: number;
  style?: React.CSSProperties;
}

${components.join('\n\n')}

${shipSpritesArray}
`;

  fs.writeFileSync(SPRITES_FILE, output, 'utf-8');
  console.log(`\nWrote ${SPRITES_FILE}`);
}

main();
