'use client';

export function StartButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      id="start-button"
      className={`win-btn-start${active ? ' active' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <img
        src="shell/icons/start-button.png"
        alt="Start"
        style={{ height: 18, display: 'block' }}
      />
    </button>
  );
}
