/**
 * Neo-brutalist palette for KarpOS taskbar icon tiles.
 * Color per app is stable (hash of app id), not random on each render.
 */
export const KARPOS_TASKBAR_TILE_BG: readonly string[] = [
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

/** FNV-1a-ish hash → index into {@link KARPOS_TASKBAR_TILE_BG}. */
export function karposTaskbarTileBackground(appId: string): string {
  let h = 2166136261;
  for (let i = 0; i < appId.length; i++) {
    h ^= appId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % KARPOS_TASKBAR_TILE_BG.length;
  return KARPOS_TASKBAR_TILE_BG[idx]!;
}
