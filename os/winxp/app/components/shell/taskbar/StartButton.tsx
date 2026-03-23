'use client';

export function StartButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      id="start-button"
      className={active ? 'active' : ''}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <img
        src="shell/icons/start-button.png"
        alt=""
        style={{ height: 18, display: 'block', imageRendering: 'pixelated' }}
      />
      <span>start</span>
    </button>
  );
}
