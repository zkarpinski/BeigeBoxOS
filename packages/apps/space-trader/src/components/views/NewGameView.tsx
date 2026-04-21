import React, { useState } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { GameModal } from '../modals/GameModal';
import { InformationButton } from '../common/InformationButton';
import { PalmKeyboard } from '../modals/PalmKeyboard';

interface NewGameViewProps {
  onStart: () => void;
}

const DIFFICULTIES = ['Beginner', 'Easy', 'Normal', 'Hard', 'Impossible'];

const stepBtnStyle: React.CSSProperties = {
  width: '22px',
  height: '22px',
  border: '1px solid #555',
  borderRadius: '5px',
  background: '#f0f0f0',
  fontSize: '14px',
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  fontFamily: 'monospace',
};

const nameRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginTop: '10px',
  marginBottom: '15px',
  fontSize: '14px',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '1px',
  fontSize: '14px',
};

const labelStyle: React.CSSProperties = {
  width: '90px',
  flexShrink: 0,
};

export const NewGameView: React.FC<NewGameViewProps> = ({ onStart }) => {
  const { startNewGame } = useSpaceTraderGame();
  const [name, setName] = useState('Jameson');
  const [difficulty, setDifficulty] = useState(2); // Normal
  const [extraPoints, setExtraPoints] = useState(16);
  const [skills, setSkills] = useState({ pilot: 1, fighter: 1, trader: 1, engineer: 1 });
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const adjustSkill = (skill: keyof typeof skills, delta: number) => {
    if (delta > 0 && extraPoints <= 0) return;
    if (delta > 0 && skills[skill] >= 10) return;
    if (delta < 0 && skills[skill] <= 1) return;
    setSkills((prev) => ({ ...prev, [skill]: prev[skill] + delta }));
    setExtraPoints((p) => p - delta);
  };

  const adjustDifficulty = (delta: number) => {
    setDifficulty((d) => Math.max(0, Math.min(4, d + delta)));
  };

  const Stepper = ({
    value,
    onMinus,
    onPlus,
  }: {
    value: React.ReactNode;
    onMinus: () => void;
    onPlus: () => void;
  }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button style={stepBtnStyle} onClick={onMinus}>
        -
      </button>
      <span style={{ minWidth: '25px', textAlign: 'center', fontFamily: 'monospace' }}>
        {value}
      </span>
      <button style={stepBtnStyle} onClick={onPlus}>
        +
      </button>
    </div>
  );

  return (
    <>
      <GameModal
        isOpen={true}
        onClose={() => {}}
        title="New Commander"
        titleRight={
          <InformationButton onClick={() => {}} style={{ position: 'relative', right: 'auto' }} />
        }
        footer={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => {
                startNewGame(name, difficulty, skills);
                onStart();
              }}
              className="palm-btn"
              style={{
                padding: '2px 32px',
                fontSize: '11px',
              }}
            >
              OK
            </button>
          </div>
        }
      >
        {/* Name */}
        <div style={nameRowStyle}>
          <span style={labelStyle}>Name:</span>
          <span
            onClick={() => setIsKeyboardOpen(true)}
            style={{
              flex: 1,
              borderBottom: '1px dotted #000',
              fontFamily: 'monospace',
              minHeight: '16px',
              paddingLeft: '2px',
              cursor: 'pointer',
            }}
          >
            {name}
          </span>
        </div>

        {/* Difficulty */}
        <div style={rowStyle}>
          <span style={labelStyle}>Difficulty:</span>
          <Stepper
            value={DIFFICULTIES[difficulty]}
            onMinus={() => adjustDifficulty(-1)}
            onPlus={() => adjustDifficulty(1)}
          />
        </div>

        {/* Skill points remaining */}
        <div style={rowStyle}>
          <span style={labelStyle}>Skill points:</span>
          <span style={{ fontFamily: 'monospace', paddingLeft: '40px' }}>{extraPoints}</span>
        </div>

        {/* Individual skills */}
        {(['pilot', 'fighter', 'trader', 'engineer'] as const).map((skill) => (
          <div key={skill} style={rowStyle}>
            <span style={labelStyle}>{skill.charAt(0).toUpperCase() + skill.slice(1)}:</span>
            <Stepper
              value={skills[skill]}
              onMinus={() => adjustSkill(skill, -1)}
              onPlus={() => adjustSkill(skill, 1)}
            />
          </div>
        ))}
      </GameModal>

      {isKeyboardOpen && (
        <PalmKeyboard
          initialValue={name}
          maxLength={16}
          onComplete={(val) => {
            setName(val);
            setIsKeyboardOpen(false);
          }}
          onCancel={() => setIsKeyboardOpen(false)}
        />
      )}
    </>
  );
};
