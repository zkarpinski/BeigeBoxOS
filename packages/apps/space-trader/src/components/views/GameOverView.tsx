import React, { useMemo } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import {
  ShipTypes,
  Weapons,
  Shields,
  Gadgets,
  ESCAPE_POD_PRICE,
  DifficultyLevel,
} from '../../logic/DataTypes';
import type { SpaceTraderState } from '../../logic/store/types';

function calcScore(
  credits: number,
  debt: number,
  ship: SpaceTraderState['ship'],
  difficulty: number,
): { netWorth: number; score: number; shipValue: number; equipValue: number } {
  const shipValue = Math.floor(ShipTypes[ship.type].price * 0.9);

  const weaponValue = ship.weapon
    .filter((w) => w >= 0)
    .reduce((sum, w) => sum + Math.floor(Weapons[w].price * 0.5), 0);
  const shieldValue = ship.shield
    .filter((s) => s >= 0)
    .reduce((sum, s) => sum + Math.floor(Shields[s].price * 0.5), 0);
  const gadgetValue = ship.gadget
    .filter((g) => g >= 0)
    .reduce((sum, g) => sum + Math.floor(Gadgets[g].price * 0.5), 0);
  const podValue = ship.escapePod ? Math.floor(ESCAPE_POD_PRICE * 0.5) : 0;
  const equipValue = weaponValue + shieldValue + gadgetValue + podValue;

  const netWorth = credits + shipValue + equipValue - debt;
  const score = Math.max(0, Math.round((netWorth * (5 - difficulty)) / 1000));
  return { netWorth, score, shipValue, equipValue };
}

function scoreRank(score: number): string {
  if (score < 50) return 'Mostly Harmless';
  if (score < 100) return 'Poor';
  if (score < 200) return 'Average';
  if (score < 500) return 'Above Average';
  if (score < 1000) return 'Competent';
  if (score < 2000) return 'Dangerous';
  if (score < 4000) return 'Deadly';
  return 'Elite';
}

function fmt(n: number): string {
  return n.toLocaleString();
}

/**
 * Game Over screen matching the original PalmOS Space Trader.
 * Defeat: "YOU ARE DESTROYED" over a starfield with score breakdown.
 * Victory: "CONGRATULATIONS" with score breakdown.
 */
export const GameOverView: React.FC = () => {
  const {
    restartGame,
    moonBought,
    credits,
    debt,
    ship,
    difficulty,
    days,
    killsPirate,
    killsPolice,
    nameCommander,
  } = useSpaceTraderGame();
  const isVictory = moonBought;

  const { netWorth, score, shipValue, equipValue } = useMemo(
    () => calcScore(credits, debt, ship, difficulty),
    [credits, debt, ship, difficulty],
  );
  const rank = scoreRank(score);

  // Generate random stars once
  const stars = useMemo(() => {
    const result: { x: number; y: number; size: number; bright: boolean }[] = [];
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

  const divider = <div style={{ borderTop: '1px solid #444', margin: '4px 0' }} role="separator" />;

  const row = (label: string, value: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', lineHeight: '1.5' }}>
      <span style={{ color: '#aaa' }}>{label}</span>
      <span style={{ color: '#fff' }}>{value}</span>
    </div>
  );

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
      </div>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '8px 10px',
          fontFamily: 'monospace',
          fontSize: '11px',
          boxSizing: 'border-box',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: isVictory ? '#44cc44' : '#cc0000',
            letterSpacing: '1px',
            marginBottom: '6px',
          }}
        >
          {isVictory ? 'CONGRATULATIONS' : 'YOU ARE DESTROYED'}
        </div>

        {/* Commander name */}
        <div style={{ color: '#ccc', marginBottom: '6px' }}>
          Commander {nameCommander || 'Unknown'}
        </div>

        {/* Score panel */}
        <div
          style={{
            background: 'rgba(0,0,0,0.7)',
            border: '1px solid #444',
            padding: '6px 8px',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <div style={{ color: '#888', marginBottom: '3px', fontSize: '10px' }}>NET WORTH</div>
          {row('Credits', `${fmt(credits)} cr`)}
          {row('Ship value', `${fmt(shipValue)} cr`)}
          {row('Equipment', `${fmt(equipValue)} cr`)}
          {debt > 0 && row('Debt', `−${fmt(debt)} cr`)}
          {divider}
          {row('Net worth', `${fmt(netWorth)} cr`)}

          <div style={{ marginTop: '8px', color: '#888', fontSize: '10px', marginBottom: '3px' }}>
            PERFORMANCE
          </div>
          {row('Days played', String(days))}
          {row('Pirates killed', String(killsPirate))}
          {killsPolice > 0 && row('Police killed', String(killsPolice))}
          {row('Difficulty', DifficultyLevel[difficulty] ?? String(difficulty))}

          {divider}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>SCORE</span>
            <span style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '14px' }}>
              {fmt(score)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#aaa' }}>Rank</span>
            <span style={{ color: '#fff' }}>{rank}</span>
          </div>
        </div>

        {/* OK button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
          <button
            onClick={restartGame}
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#cc0000',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
