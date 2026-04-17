import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { DifficultyLevel, ShipTypes } from '../../logic/DataTypes';
import { calculateNetWorth } from '../../logic/store/bankSlice';

// OG rating titles based on score thresholds
const RATINGS = [
  { min: 0, title: 'Beginner' },
  { min: 20, title: 'Trainee' },
  { min: 50, title: 'Amateur' },
  { min: 100, title: 'Competent' },
  { min: 180, title: 'Dangerous' },
  { min: 280, title: 'Deadly' },
  { min: 400, title: 'Elite' },
  { min: 600, title: 'Master' },
  { min: 900, title: 'Ultimate' },
];

function getRating(score: number): string {
  let title = RATINGS[0].title;
  for (const r of RATINGS) {
    if (score >= r.min) title = r.title;
  }
  return title;
}

export const GameOverView: React.FC = () => {
  const state = useSpaceTraderGame();
  const {
    restartGame,
    nameCommander,
    days,
    credits,
    difficulty,
    killsPirate,
    killsPolice,
    reputationScore,
    policeRecordScore,
    moonBought,
  } = state;

  const netWorth = calculateNetWorth(state);
  const isVictory = moonBought;

  // OG score formula: net worth scaled by difficulty, penalized by days, bonus for kills/quests
  const diffMultiplier = (difficulty + 1) * 0.5;
  const worthScore = Math.floor(netWorth / 500) * diffMultiplier;
  const killScore = (killsPirate * 2 + killsPolice) * diffMultiplier;
  const dayPenalty = Math.floor(days * 0.5);
  const repBonus = Math.max(0, reputationScore) * 2;
  const victoryBonus = isVictory ? 500 * (difficulty + 1) : 0;
  const totalScore = Math.max(
    0,
    Math.floor(worthScore + killScore - dayPenalty + repBonus + victoryBonus),
  );
  const rating = getRating(totalScore);

  const row = (label: string, value: string | number) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '3px',
        fontSize: '13px',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div
      className="palm-window"
      style={{
        background: '#000',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="palm-header"
        style={{
          width: '100%',
          background: isVictory ? '#006600' : '#cc0000',
          textAlign: 'center',
          padding: '4px',
          fontWeight: 'bold',
        }}
      >
        {isVictory ? 'VICTORY!' : 'GAME OVER'}
      </div>

      <div className="palm-content" style={{ padding: '12px', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: isVictory ? '#0f0' : '#f00',
              marginBottom: '4px',
            }}
          >
            {isVictory ? 'Congratulations!' : 'DEFEAT'}
          </div>
          <div style={{ fontSize: '13px', color: '#ccc' }}>
            {isVictory
              ? `Commander ${nameCommander} has retired to the moon!`
              : `Commander ${nameCommander} is lost in the void.`}
          </div>
        </div>

        <div
          style={{
            border: '1px solid #555',
            padding: '8px',
            marginBottom: '10px',
            background: '#111',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '6px',
              borderBottom: '1px solid #444',
              paddingBottom: '4px',
            }}
          >
            Final Score
          </div>
          {row('Difficulty:', DifficultyLevel[difficulty])}
          {row('Days:', days)}
          {row('Net Worth:', `${netWorth} cr.`)}
          {row('Ship:', ShipTypes[state.ship.type].name)}
          {row('Pirate Kills:', killsPirate)}
          {row('Police Kills:', killsPolice)}
          {row('Reputation:', reputationScore)}
          {row('Police Record:', policeRecordScore)}

          <div
            style={{
              borderTop: '1px solid #444',
              marginTop: '6px',
              paddingTop: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            <span>Score:</span>
            <span>{totalScore}</span>
          </div>
          <div
            style={{
              textAlign: 'center',
              marginTop: '4px',
              fontSize: '16px',
              color: '#ff0',
              fontWeight: 'bold',
            }}
          >
            {rating}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            className="palm-btn-large"
            style={{
              background: '#fff',
              color: '#000',
              padding: '8px 24px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
            onClick={restartGame}
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};
