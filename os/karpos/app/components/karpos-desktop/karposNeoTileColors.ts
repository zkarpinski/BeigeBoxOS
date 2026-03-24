/**
 * Shared neo-brutalist tile palette for KarpOS (taskbar chips, desktop icons).
 * Color per item is stable (hash of key), not random on each render.
 */
export const KARPOS_NEO_TILE_PALETTE: readonly string[] = [
  '#fde047', // yellow
  '#7dd3fc', // sky
  '#fb64b6', // pink
  '#bef264', // lime
  '#fffef8', // paper
  '#22d3ee', // cyan
  '#fdba74', // orange
  '#c4b5fd', // violet
  '#86efac', // mint
  '#fcd34d', // amber
  '#f9a8d4', // rose
  '#a5f3fc', // light cyan
] as const;

/** FNV-1a-ish hash → index into {@link KARPOS_NEO_TILE_PALETTE}. */
export function karposNeoTileColor(key: string): string {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % KARPOS_NEO_TILE_PALETTE.length;
  return KARPOS_NEO_TILE_PALETTE[idx]!;
}
