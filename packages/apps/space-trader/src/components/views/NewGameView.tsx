import React, { useState } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

interface NewGameViewProps {
  onStart: () => void;
}

export const NewGameView: React.FC<NewGameViewProps> = ({ onStart }) => {
  const { startNewGame } = useSpaceTraderGame();
  const [name, setName] = useState('Jameson');
  const [skills, setSkills] = useState({ pilot: 4, fighter: 4, trader: 4, engineer: 4 });
  const [difficulty, setDifficulty] = useState(2);

  const totalPoints = skills.pilot + skills.fighter + skills.trader + skills.engineer;
  const maxPoints = 16;

  const handleSkillChange = (skill: keyof typeof skills, delta: number) => {
    if (delta > 0 && totalPoints >= maxPoints) return;
    if (delta < 0 && skills[skill] <= 1) return;
    setSkills({ ...skills, [skill]: skills[skill] + delta });
  };

  return (
    <div className="new-game-view palm-window">
      <div className="palm-header">New Game</div>

      <div
        className="palm-content"
        style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <div>
          <span>Name: </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100px', border: '1px solid #000' }}
          />
        </div>

        <div className="skill-section">
          <p>Skill Points: {maxPoints - totalPoints} remaining</p>
          {Object.entries(skills).map(([s, val]) => (
            <div
              key={s}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
              }}
            >
              <span style={{ textTransform: 'capitalize' }}>{s}:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button className="palm-btn-small" onClick={() => handleSkillChange(s as any, -1)}>
                  -
                </button>
                <span style={{ width: '20px', textAlign: 'center' }}>{val}</span>
                <button className="palm-btn-small" onClick={() => handleSkillChange(s as any, 1)}>
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <span>Difficulty: </span>
          <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
            <option value={0}>Beginner</option>
            <option value={1}>Easy</option>
            <option value={2}>Normal</option>
            <option value={3}>Hard</option>
            <option value={4}>Impossible</option>
          </select>
        </div>

        <button
          className="palm-btn-large"
          style={{
            marginTop: 'auto',
            padding: '10px',
            background: '#2a3d66',
            color: 'white',
            fontWeight: 'bold',
          }}
          onClick={() => {
            startNewGame(name, difficulty, skills);
            onStart();
          }}
        >
          Start Trading
        </button>
      </div>
    </div>
  );
};
