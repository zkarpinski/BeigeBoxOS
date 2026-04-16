import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ViewType, SystemNames } from '../../logic/DataTypes';
import { GameModal } from '../modals/GameModal';
import {
  ACAMARSYSTEM,
  BARATASSYSTEM,
  MELINASYSTEM,
  REGULASSYSTEM,
  ZALKONSYSTEM,
  JAPORISYSTEM,
  NIXSYSTEM,
  DEVIDIASYSTEM,
  KRAVATSYSTEM,
  GEMULONSYSTEM,
  DALEDSYSTEM,
} from '../../logic/SpecialEvents';

interface QuestsViewProps {
  onViewChange: (view: ViewType) => void;
}

const btnStyle: React.CSSProperties = {
  padding: '3px 16px',
  border: '1.5px solid #000',
  borderRadius: '12px',
  background: '#fff',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'monospace',
};

function sysName(idx: number): string {
  return SystemNames[idx] ?? `System ${idx}`;
}

export const QuestsView: React.FC<QuestsViewProps> = ({ onViewChange }) => {
  const {
    monsterStatus,
    dragonflyStatus,
    japoriStatus,
    reactorStatus,
    jarekStatus,
    wildStatus,
    artifactStatus,
    scarabStatus,
    invasionStatus,
    experimentStatus,
    jarekOnBoard,
    wildOnBoard,
    reactorOnBoard,
    artifactOnBoard,
    antidoteOnBoard,
  } = useSpaceTraderGame();

  const quests: { name: string; status: string }[] = [];

  // Space Monster
  if (monsterStatus === 1) {
    quests.push({
      name: 'Space Monster',
      status: `Travel to ${sysName(ACAMARSYSTEM)} to fight it`,
    });
  } else if (monsterStatus === 2) {
    quests.push({
      name: 'Space Monster',
      status: `Visit ${sysName(ACAMARSYSTEM)} to claim reward`,
    });
  }

  // Dragonfly
  if (dragonflyStatus >= 1 && dragonflyStatus < 5) {
    const destinations = [
      `Go to ${sysName(BARATASSYSTEM)}`,
      `Go to ${sysName(MELINASYSTEM)}`,
      `Go to ${sysName(REGULASSYSTEM)}`,
      `Go to ${sysName(ZALKONSYSTEM)} — beware!`,
    ];
    quests.push({
      name: 'Dragonfly Hunt',
      status: destinations[dragonflyStatus - 1],
    });
  } else if (dragonflyStatus === 5) {
    quests.push({ name: 'Dragonfly Hunt', status: `Visit ${sysName(ZALKONSYSTEM)} for reward` });
  }

  // Japori Disease
  if (japoriStatus === 1) {
    quests.push({ name: 'Japori Disease', status: `Deliver antidote to ${sysName(JAPORISYSTEM)}` });
  }

  // Morgan's Reactor
  if (reactorStatus === 1) {
    quests.push({ name: "Morgan's Reactor", status: `Deliver reactor to ${sysName(NIXSYSTEM)}` });
  } else if (reactorStatus === 2) {
    quests.push({
      name: "Morgan's Reactor",
      status: `Return to ${sysName(NIXSYSTEM)} for laser (need free weapon slot)`,
    });
  }

  // Jarek
  if (jarekStatus === 1) {
    quests.push({ name: 'Ambassador Jarek', status: `Transport to ${sysName(DEVIDIASYSTEM)}` });
  }

  // Wild
  if (wildStatus === 1) {
    quests.push({ name: 'Jonathan Wild', status: `Smuggle to ${sysName(KRAVATSYSTEM)}` });
  }

  // Artifact
  if (artifactStatus === 1) {
    quests.push({ name: 'Alien Artifact', status: 'Deliver to the professor' });
  }

  // Scarab
  if (scarabStatus === 1) {
    quests.push({ name: 'Scarab', status: 'Hunt near wormhole systems' });
  } else if (scarabStatus === 2) {
    quests.push({ name: 'Scarab', status: 'Visit system for hull upgrade' });
  }

  // Gemulon Invasion
  if (invasionStatus === 1) {
    quests.push({
      name: 'Alien Invasion',
      status: `Warn ${sysName(GEMULONSYSTEM)} before time runs out!`,
    });
  }

  // Experiment
  if (experimentStatus === 1) {
    quests.push({
      name: 'Dangerous Experiment',
      status: `Stop experiment at ${sysName(DALEDSYSTEM)}!`,
    });
  }

  // Special cargo
  const cargo: string[] = [];
  if (antidoteOnBoard) cargo.push('Antidote (10 bays)');
  if (reactorOnBoard) cargo.push('Reactor (5 bays, leaking!)');
  if (jarekOnBoard) cargo.push('Ambassador Jarek (1 bay)');
  if (wildOnBoard) cargo.push('Jonathan Wild (1 bay)');
  if (artifactOnBoard) cargo.push('Alien Artifact (1 bay)');

  return (
    <GameModal
      isOpen={true}
      onClose={() => {}}
      title="Quests"
      footer={
        <button style={btnStyle} onClick={() => onViewChange('ship')}>
          Done
        </button>
      }
    >
      {quests.length === 0 && cargo.length === 0 && (
        <div style={{ fontSize: '13px', color: '#666' }}>No active quests.</div>
      )}

      {quests.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
            Active Quests:
          </div>
          {quests.map((q, i) => (
            <div key={i} style={{ fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold' }}>{q.name}</span>
              <br />
              <span style={{ color: '#444', marginLeft: '8px' }}>{q.status}</span>
            </div>
          ))}
        </div>
      )}

      {cargo.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
            Special Cargo:
          </div>
          {cargo.map((c, i) => (
            <div key={i} style={{ fontSize: '12px', marginLeft: '8px' }}>
              {c}
            </div>
          ))}
        </div>
      )}
    </GameModal>
  );
};
