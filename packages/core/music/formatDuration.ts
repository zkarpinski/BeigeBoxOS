/** e.g. 215 → "3:35" */
export function formatDurationMmSs(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '--:--';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Same as Napster legacy display: no leading zero on minutes. */
export function formatDurationLegacy(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '--:--';
  return (
    Math.floor(totalSeconds / 60) + ':' + String(Math.floor(totalSeconds % 60)).padStart(2, '0')
  );
}
