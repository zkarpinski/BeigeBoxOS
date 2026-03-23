/**
 * Open Spotify search for a track (no API keys; opens web player search).
 * Shared by Napster, iTunes-style apps, and other music UIs.
 */
export function spotifySearchUrlForTrack(artist: string, title: string): string {
  const slug = (artist + ' ' + title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return 'https://open.spotify.com/search/' + encodeURIComponent(slug);
}

/** Open Spotify search in a new tab (browser only). */
export function openSpotifyForTrack(
  artist: string,
  title: string,
  target: string = '_blank',
  features: string = 'noopener,noreferrer',
): void {
  if (typeof window === 'undefined') return;
  window.open(spotifySearchUrlForTrack(artist, title), target, features);
}
