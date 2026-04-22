import React, { useMemo } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

/**
 * Game Over screen matching the original PalmOS Space Trader.
 * Defeat: "YOU ARE DESTROYED" over a starfield with OK button.
 * Victory: "CONGRATULATIONS" over a starfield with OK button.
 */
export const GameOverView: React.FC = () => {
  const { restartGame, moonBought } = useSpaceTraderGame();
  const isVictory = moonBought;

  // Generate random stars once
  const stars = useMemo(() => {
    const result: { x: number; y: number; size: number; bright: boolean }[] = [];
    // Seeded pseudo-random for consistent look
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 120; i++) {
      result.push({
        x: rand() * 100,
        y: rand() * 100,
        size: rand() < 0.15 ? 2 : 1,
        bright: rand() < 0.3,
      });
    }
    return result;
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '2px solid #888',
      }}
    >
      {/* Starfield background */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {stars.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: s.bright ? '#fff' : '#888',
              borderRadius: s.size > 1 ? '50%' : undefined,
            }}
          />
        ))}
        {/* Planet/moon in upper left */}
        <div
          style={{
            position: 'absolute',
            left: '8%',
            top: '18%',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #ddcc44, #aa8800, #664400)',
          }}
        />
        {/* Asteroid/debris */}
        <div
          style={{
            position: 'absolute',
            left: '45%',
            top: '55%',
            width: '40px',
            height: '36px',
            borderRadius: '40% 50% 45% 55%',
            background: 'radial-gradient(ellipse at 40% 40%, #777, #444, #222)',
            transform: 'rotate(-15deg)',
          }}
        />
        {/* Small debris pieces */}
        <div
          style={{
            position: 'absolute',
            left: '55%',
            top: '28%',
            width: '12px',
            height: '10px',
            background: '#555',
            clipPath: 'polygon(50% 0%, 100% 40%, 80% 100%, 20% 100%, 0% 40%)',
            transform: 'rotate(20deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '72%',
            top: '42%',
            width: '8px',
            height: '7px',
            background: '#666',
            clipPath: 'polygon(50% 0%, 100% 50%, 70% 100%, 0% 80%)',
            transform: 'rotate(-30deg)',
          }}
        />
        {/* Colored indicator dots on asteroid (like lights on a station) */}
        <div
          style={{
            position: 'absolute',
            left: 'calc(45% + 10px)',
            top: 'calc(55% + 10px)',
            width: '2px',
            height: '2px',
            background: '#ff0000',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 'calc(45% + 22px)',
            top: 'calc(55% + 8px)',
            width: '2px',
            height: '2px',
            background: '#00ff00',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 'calc(45% + 16px)',
            top: 'calc(55% + 24px)',
            width: '2px',
            height: '2px',
            background: '#0044ff',
          }}
        />
      </div>

      {/* Title text */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '8px 6px',
          fontFamily: 'monospace',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#cc0000',
          letterSpacing: '2px',
          textShadow: '1px 1px 0 #440000',
        }}
      >
        {isVictory ? 'CONGRATULATIONS' : 'YOU ARE DESTROYED'}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* OK button — bottom right, matching original */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '8px 12px',
        }}
      >
        <button
          onClick={restartGame}
          style={{
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#cc0000',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            letterSpacing: '1px',
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};
