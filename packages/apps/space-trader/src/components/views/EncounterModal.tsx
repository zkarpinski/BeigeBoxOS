import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ShipTypes, Shields } from '../../logic/DataTypes';
import { ENCOUNTER_PIRATE, ENCOUNTER_POLICE, ENCOUNTER_TRADER } from '../../logic/Encounter';

/**
 * PalmOS-style gauge bar: solid black fill within a bordered rect.
 * Matches the original Space Trader GaugeType control appearance.
 */
function PalmGauge({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0;
  return (
    <div
      style={{
        display: 'inline-block',
        width: '80px',
        height: '7px',
        border: '1px solid #000',
        background: '#fff',
        verticalAlign: 'middle',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: '#000',
        }}
      />
    </div>
  );
}

function ShipStatus({
  label,
  hull,
  maxHull,
  shieldStrength,
}: {
  label: string;
  hull: number;
  maxHull: number;
  shieldStrength: number[];
}) {
  const totalShield = shieldStrength.reduce((a, v) => a + Math.max(0, v), 0);
  // Max possible shield = sum of full power for each installed slot.
  // We track current only; for display purposes cap at 100% (current IS max after warp reset).
  const maxShield = totalShield; // at warp start shields are full; only decrements in combat

  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '1px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px' }}>
        <span style={{ width: '30px' }}>Hull</span>
        <PalmGauge current={hull} max={maxHull} />
        <span style={{ fontFamily: 'monospace' }}>{hull}</span>
      </div>
      {totalShield > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px' }}>
          <span style={{ width: '30px' }}>Shld</span>
          <PalmGauge current={totalShield} max={maxShield} />
          <span style={{ fontFamily: 'monospace' }}>{totalShield}</span>
        </div>
      )}
    </div>
  );
}

export const EncounterModal: React.FC = () => {
  const {
    encounter,
    ship,
    clearEncounter,
    attackInEncounter,
    fleeFromEncounter,
    surrenderToEncounter,
    bribePolice,
    lootNPC,
  } = useSpaceTraderGame();

  if (!encounter) return null;

  const npcShipType = ShipTypes[encounter.npc.ship.type];
  const playerShipType = ShipTypes[ship.type];

  const typeLabel =
    encounter.type === ENCOUNTER_PIRATE
      ? 'Pirate'
      : encounter.type === ENCOUNTER_POLICE
        ? 'Police'
        : 'Trader';

  const lastMessage = encounter.log.length > 0 ? encounter.log[encounter.log.length - 1] : null;

  const hasLoot =
    encounter.resolved && encounter.playerWon && encounter.npc.lootCargo.some((v) => v > 0);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--palm-bg, #ececec)',
      }}
    >
      {/* Title bar — matches PalmHeader style */}
      <div
        style={{
          background: 'var(--palm-header-bg, #1a1a8c)',
          color: '#fff',
          padding: '2px 6px',
          fontWeight: 'bold',
          fontSize: '11px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {encounter.resolved ? (encounter.playerWon ? 'You Win!' : 'Encounter Over') : 'Encounter!'}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '6px 8px', overflowY: 'auto' }}>
        {/* Encounter description */}
        <div
          style={{
            fontSize: '10px',
            marginBottom: '6px',
            borderBottom: '1px solid #000',
            paddingBottom: '4px',
          }}
        >
          {encounter.resolved
            ? encounter.playerWon
              ? `You destroyed the ${typeLabel}'s ${npcShipType.name}!`
              : `You escaped the ${typeLabel}.`
            : `You encounter a ${typeLabel} flying a ${npcShipType.name}.`}
        </div>

        {/* Ship status — your ship */}
        <ShipStatus
          label={`Your ${playerShipType.name}`}
          hull={ship.hull}
          maxHull={playerShipType.hullStrength}
          shieldStrength={ship.shieldStrength}
        />

        {/* Ship status — NPC ship */}
        <ShipStatus
          label={`${typeLabel} ${npcShipType.name}`}
          hull={encounter.npc.ship.hull}
          maxHull={npcShipType.hullStrength}
          shieldStrength={encounter.npc.ship.shieldStrength}
        />

        {/* Last combat message */}
        {lastMessage && (
          <div
            style={{
              fontSize: '9px',
              borderTop: '1px solid #000',
              paddingTop: '4px',
              marginTop: '4px',
              minHeight: '20px',
              color: '#000',
            }}
          >
            {lastMessage}
          </div>
        )}
      </div>

      {/* Footer buttons — matches original PalmOS button strip */}
      <div
        style={{
          borderTop: '1px solid #000',
          display: 'flex',
          background: 'var(--palm-bg, #ececec)',
        }}
      >
        {encounter.resolved ? (
          <>
            {hasLoot && (
              <button
                className="palm-btn"
                style={{ flex: 1, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}
                onClick={lootNPC}
              >
                Loot
              </button>
            )}
            <button
              className="palm-btn"
              style={{ flex: 1, borderTop: 'none', borderBottom: 'none', borderRight: 'none' }}
              onClick={clearEncounter}
            >
              Done
            </button>
          </>
        ) : (
          <>
            {encounter.type !== ENCOUNTER_TRADER && (
              <button
                className="palm-btn"
                style={{ flex: 1, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}
                onClick={attackInEncounter}
              >
                Attack
              </button>
            )}
            <button
              className="palm-btn"
              style={{
                flex: 1,
                borderTop: 'none',
                borderBottom: 'none',
                borderLeft: encounter.type === ENCOUNTER_TRADER ? 'none' : undefined,
              }}
              onClick={fleeFromEncounter}
            >
              Flee
            </button>
            {encounter.type === ENCOUNTER_PIRATE && (
              <button
                className="palm-btn"
                style={{ flex: 1, borderTop: 'none', borderBottom: 'none', borderRight: 'none' }}
                onClick={surrenderToEncounter}
              >
                Surrender
              </button>
            )}
            {encounter.type === ENCOUNTER_POLICE && (
              <>
                <button
                  className="palm-btn"
                  style={{ flex: 1, borderTop: 'none', borderBottom: 'none' }}
                  onClick={surrenderToEncounter}
                >
                  Submit
                </button>
                <button
                  className="palm-btn"
                  style={{ flex: 1, borderTop: 'none', borderBottom: 'none', borderRight: 'none' }}
                  onClick={bribePolice}
                >
                  Bribe
                </button>
              </>
            )}
            {encounter.type === ENCOUNTER_TRADER && (
              <button
                className="palm-btn"
                style={{ flex: 1, borderTop: 'none', borderBottom: 'none', borderRight: 'none' }}
                onClick={surrenderToEncounter}
              >
                Ignore
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
