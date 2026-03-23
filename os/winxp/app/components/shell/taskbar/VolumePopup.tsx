'use client';

export function VolumePopup({ open }: { open: boolean }) {
  return (
    <div id="volume-popup" className={`volume-popup${open ? '' : ' hidden'}`}>
      <div className="volume-popup-label">Volume</div>
      <div className="volume-popup-track">
        <input type="range" id="volume-slider" min="0" max="100" defaultValue="75" />
      </div>
      <div className="volume-popup-icon">🔊</div>
    </div>
  );
}
