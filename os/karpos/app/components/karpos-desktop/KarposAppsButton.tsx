'use client';

/**
 * Neo-brutalist launcher for the KarpOS applications menu (replaces Win98 “Start”).
 * Add a leading icon inside `.karpos-apps-launcher__inner` when ready.
 */
export function KarposAppsButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      id="start-button"
      type="button"
      className={`karpos-apps-launcher${active ? ' active' : ''}`}
      aria-label="Applications"
      aria-expanded={active}
      aria-haspopup="dialog"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span className="karpos-apps-launcher__inner">
        {/* Optional grid / icon — drop an <img /> or inline SVG here */}
        <span className="karpos-apps-launcher__label">APPS</span>
      </span>
    </button>
  );
}
