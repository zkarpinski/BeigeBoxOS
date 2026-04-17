import React, { useState, useEffect, useRef } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ShipTypes, SystemNames, Weapons, Shields } from '../../logic/DataTypes';
import {
  ENCOUNTER_PIRATE,
  ENCOUNTER_POLICE,
  ENCOUNTER_TRADER,
  ENCOUNTER_MONSTER,
  ENCOUNTER_DRAGONFLY,
  ENCOUNTER_SCARAB,
} from '../../logic/Encounter';
import { SHIP_SPRITES } from '../../assets/ships/ShipSprites';
import { GameModal } from '../modals/GameModal';
import { InformationButton } from '../common/InformationButton';

const FILTER_BLUE = 'brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(190deg)';
const FILTER_GREEN = 'brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(90deg)';
const FILTER_RED = 'brightness(0) invert(1) sepia(1) saturate(8) hue-rotate(330deg)';

function ColoredShip({
  spriteIndex,
  scale,
  baseFilter,
  damageRatio,
  flip,
}: {
  spriteIndex: number;
  scale: number;
  baseFilter: string;
  damageRatio: number;
  flip?: boolean;
}) {
  const Sprite = SHIP_SPRITES[spriteIndex] ?? SHIP_SPRITES[0];
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        transform: flip ? 'scaleX(-1)' : undefined,
        lineHeight: 0,
      }}
    >
      <Sprite scale={scale} style={{ filter: baseFilter }} />
      {damageRatio > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, opacity: damageRatio }}>
          <Sprite scale={scale} style={{ filter: FILTER_RED }} />
        </div>
      )}
    </div>
  );
}

function EncounterIcon({ type }: { type: string }) {
  if (type === ENCOUNTER_POLICE) {
    // Police badge: shield shape with a star
    return (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <path
          d="M14 2 L24 6 L24 16 Q24 23 14 27 Q4 23 4 16 L4 6 Z"
          fill="#1a1a8c"
          stroke="#000"
          strokeWidth="1"
        />
        <polygon
          points="14,8 15.5,12.5 20,12.5 16.5,15.5 18,20 14,17 10,20 11.5,15.5 8,12.5 12.5,12.5"
          fill="#fff"
        />
      </svg>
    );
  }
  if (type === ENCOUNTER_PIRATE) {
    // Skull
    return (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <ellipse cx="14" cy="12" rx="9" ry="9" fill="#333" stroke="#000" strokeWidth="1" />
        <rect x="8" y="19" width="12" height="5" rx="2" fill="#333" stroke="#000" strokeWidth="1" />
        <rect x="10" y="21" width="2" height="3" fill="#fff" />
        <rect x="13" y="21" width="2" height="3" fill="#fff" />
        <rect x="16" y="21" width="2" height="3" fill="#fff" />
        <circle cx="10.5" cy="12" r="2.5" fill="#fff" />
        <circle cx="17.5" cy="12" r="2.5" fill="#fff" />
        <circle cx="10.5" cy="12" r="1" fill="#333" />
        <circle cx="17.5" cy="12" r="1" fill="#333" />
        <path d="M11 16.5 Q14 18 17 16.5" stroke="#fff" strokeWidth="1" fill="none" />
      </svg>
    );
  }
  if (type === ENCOUNTER_MONSTER || type === ENCOUNTER_DRAGONFLY || type === ENCOUNTER_SCARAB) {
    // Boss: red diamond
    return (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <polygon points="14,2 26,14 14,26 2,14" fill="#cc0000" stroke="#800" strokeWidth="1" />
        <text x="14" y="18" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">
          !
        </text>
      </svg>
    );
  }
  // Trader: coin
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="11" fill="#c8a000" stroke="#8b6000" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="8" fill="none" stroke="#8b6000" strokeWidth="1" />
      <text x="14" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#8b6000">
        $
      </text>
    </svg>
  );
}

function buildNarrativeText(
  type: string,
  npcShipName: string,
  systemName: string,
  resolved: boolean,
  playerWon: boolean,
  clickNumber: number,
  encounterAction: string,
): string[] {
  if (resolved) {
    if (playerWon) {
      if (type === ENCOUNTER_PIRATE)
        return [`You destroyed the pirate's ${npcShipName}!`, 'Check for loot before departing.'];
      if (type === ENCOUNTER_POLICE)
        return [`You destroyed the police ${npcShipName}!`, 'Your criminal record worsens.'];
      if (type === ENCOUNTER_MONSTER) return ['You destroyed the space monster!'];
      if (type === ENCOUNTER_DRAGONFLY) return ['You destroyed the Dragonfly!'];
      if (type === ENCOUNTER_SCARAB) return ['You destroyed the Scarab!'];
      return [`You destroyed the trader's ${npcShipName}!`];
    }
    if (type === ENCOUNTER_PIRATE) return ['You escaped the pirate!'];
    if (type === ENCOUNTER_POLICE) return ['The police let you go.'];
    return ['You parted ways with the trader.'];
  }

  // Boss encounters
  if (type === ENCOUNTER_MONSTER) {
    return ['A massive space monster blocks your path!', 'It attacks with terrifying force!'];
  }
  if (type === ENCOUNTER_DRAGONFLY) {
    return ['The experimental Dragonfly ship attacks!', 'It is extremely fast and dangerous!'];
  }
  if (type === ENCOUNTER_SCARAB) {
    return ['The stolen Scarab ship engages you!', 'It is heavily armored!'];
  }

  const typeLabel =
    type === ENCOUNTER_PIRATE ? 'pirate' : type === ENCOUNTER_POLICE ? 'police' : 'trader';
  const intro = `At ${clickNumber} clicks from ${systemName}, you encounter a ${typeLabel} ${npcShipName.toLowerCase()}.`;

  if (encounterAction === 'FLEE_NPC') {
    return [intro, `The ${typeLabel} is trying to get away!`];
  }
  if (encounterAction === 'INSPECT') {
    return [intro, 'They order you to submit for inspection.'];
  }
  if (encounterAction === 'TRADE_OFFER') {
    return [intro, 'You are hailed with an offer to trade goods.'];
  }
  if (type === ENCOUNTER_PIRATE) return [intro, 'They hail you with weapons hot.'];
  if (type === ENCOUNTER_POLICE) return [intro, 'They open fire!'];
  return [intro, 'You are hailed with an offer to trade goods.'];
}

const pillBtnBase: React.CSSProperties = {
  fontSize: '12px',
  fontFamily: "'MS Sans Serif', Tahoma, sans-serif",
  padding: '5px 14px',
  borderRadius: '20px',
  border: '1.5px solid #330099',
  background: '#fff',
  color: '#330099',
  cursor: 'pointer',
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
};

export const EncounterModal: React.FC = () => {
  const [showInfo, setShowInfo] = useState(false);
  const lastActionRef = useRef<'attack' | 'flee' | null>(null);
  const {
    encounter,
    ship,
    systems,
    currentSystem,
    clearEncounter,
    attackInEncounter,
    fleeFromEncounter,
    surrenderToEncounter,
    bribePolice,
    lootNPC,
    tradeWithNPC,
    letNPCGo,
    ignoreEncounter,
    optIgnoreDealingTraders,
    optContinuousFight,
    optAttackFleeing,
    optTextualEncounters,
  } = useSpaceTraderGame();

  // Continuous fight: auto-advance combat after each unresolved round
  useEffect(() => {
    if (!optContinuousFight || !encounter || encounter.resolved) return;
    if (lastActionRef.current === null) return;
    const action = lastActionRef.current;
    const timer = setTimeout(() => {
      if (action === 'attack') attackInEncounter();
      else if (action === 'flee') fleeFromEncounter();
    }, 600);
    return () => clearTimeout(timer);
  }, [encounter, optContinuousFight, attackInEncounter, fleeFromEncounter]);

  // Attack fleeing: when encounter resolves as NPC fled (playerWon=false, was attacking), auto-clear
  useEffect(() => {
    if (!optAttackFleeing || !encounter || !encounter.resolved || encounter.playerWon) return;
    if (lastActionRef.current !== 'attack') return;
    // NPC fled — clear immediately (auto-dismiss)
    const timer = setTimeout(() => clearEncounter(), 400);
    return () => clearTimeout(timer);
  }, [encounter, optAttackFleeing, clearEncounter]);

  if (!encounter) return null;

  const npcShipType = ShipTypes[encounter.npc.ship.type];
  const playerShipType = ShipTypes[ship.type];
  const destIdx = encounter.destinationSystemIdx ?? currentSystem;
  const systemName = SystemNames[systems[destIdx]?.nameIndex ?? 0] ?? 'Unknown';

  const isBoss =
    encounter.type === ENCOUNTER_MONSTER ||
    encounter.type === ENCOUNTER_DRAGONFLY ||
    encounter.type === ENCOUNTER_SCARAB;

  const typeLabel = isBoss
    ? encounter.type === ENCOUNTER_MONSTER
      ? 'Space Monster'
      : encounter.type === ENCOUNTER_DRAGONFLY
        ? 'Dragonfly'
        : 'Scarab'
    : encounter.type === ENCOUNTER_PIRATE
      ? 'Pirate'
      : encounter.type === ENCOUNTER_POLICE
        ? 'Police'
        : 'Trader';

  const lastMessage = encounter.log.length > 0 ? encounter.log[encounter.log.length - 1] : null;

  const hasLoot =
    encounter.resolved && encounter.playerWon && encounter.npc.lootCargo.some((v) => v > 0);

  const playerDamageRatio =
    playerShipType.hullStrength > 0
      ? Math.max(0, Math.min(1, 1 - ship.hull / playerShipType.hullStrength))
      : 0;
  const npcDamageRatio =
    npcShipType.hullStrength > 0
      ? Math.max(0, Math.min(1, 1 - encounter.npc.ship.hull / npcShipType.hullStrength))
      : 0;

  const narrativeLines = buildNarrativeText(
    encounter.type,
    npcShipType.name,
    systemName,
    encounter.resolved,
    encounter.playerWon,
    encounter.clickNumber,
    encounter.encounterAction,
  );

  const modalTitle = encounter.resolved
    ? encounter.playerWon
      ? 'You Win!'
      : 'Encounter Over'
    : 'Encounter!';

  const action = encounter.encounterAction;

  const attackBtn = (
    <button
      style={pillBtnBase}
      onClick={() => {
        lastActionRef.current = 'attack';
        attackInEncounter();
      }}
    >
      Attack
    </button>
  );
  const fleeBtn = (
    <button
      style={pillBtnBase}
      onClick={() => {
        lastActionRef.current = 'flee';
        fleeFromEncounter();
      }}
    >
      Flee
    </button>
  );

  let actionButtons: React.ReactNode = null;
  if (encounter.resolved) {
    actionButtons = (
      <>
        {hasLoot && (
          <button style={pillBtnBase} onClick={lootNPC}>
            Loot
          </button>
        )}
        <button style={pillBtnBase} onClick={clearEncounter}>
          Done
        </button>
      </>
    );
  } else if (action === 'FLEE_NPC') {
    // NPC is fleeing — player can pursue (attack) or let them go
    actionButtons = (
      <>
        {attackBtn}
        <button style={pillBtnBase} onClick={letNPCGo}>
          Let them go
        </button>
      </>
    );
  } else if (action === 'INSPECT') {
    // Police inspection — submit, flee, attack, or bribe
    actionButtons = (
      <>
        <button style={pillBtnBase} onClick={surrenderToEncounter}>
          Submit
        </button>
        {fleeBtn}
        {attackBtn}
        <button style={pillBtnBase} onClick={bribePolice}>
          Bribe
        </button>
      </>
    );
  } else if (action === 'TRADE_OFFER') {
    // Trader offering goods
    actionButtons = (
      <>
        {attackBtn}
        <button style={pillBtnBase} onClick={ignoreEncounter}>
          Ignore
        </button>
        {!optIgnoreDealingTraders && (
          <button style={pillBtnBase} onClick={tradeWithNPC}>
            Trade
          </button>
        )}
      </>
    );
  } else if (isBoss) {
    // Boss: attack or flee only
    actionButtons = (
      <>
        {attackBtn}
        {fleeBtn}
      </>
    );
  } else if (encounter.type === ENCOUNTER_PIRATE) {
    // Pirate attacking
    actionButtons = (
      <>
        {attackBtn}
        {fleeBtn}
        <button style={pillBtnBase} onClick={surrenderToEncounter}>
          Surrender
        </button>
      </>
    );
  } else if (encounter.type === ENCOUNTER_POLICE) {
    // Police attacking (criminal record)
    actionButtons = (
      <>
        {attackBtn}
        {fleeBtn}
        <button style={pillBtnBase} onClick={surrenderToEncounter}>
          Surrender
        </button>
        <button style={pillBtnBase} onClick={bribePolice}>
          Bribe
        </button>
      </>
    );
  } else {
    // Fallback
    actionButtons = (
      <>
        {attackBtn}
        {fleeBtn}
      </>
    );
  }

  const footer = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{actionButtons}</div>
  );

  // Info panel: NPC ship stats
  const npcWeapons = encounter.npc.ship.weapon
    .filter((w) => w >= 0)
    .map((w) => Weapons[w]?.name ?? '?');
  const npcShields = encounter.npc.ship.shield
    .filter((s) => s >= 0)
    .map((s) => Shields[s]?.name ?? '?');

  const infoPanel = (
    <div
      style={{
        fontSize: '11px',
        fontFamily: 'monospace',
        lineHeight: '1.6',
        borderTop: '1px solid #ccc',
        paddingTop: '6px',
        marginTop: '4px',
      }}
    >
      <div>
        <strong>
          {typeLabel} {npcShipType.name}
        </strong>
      </div>
      <div>
        Hull: {encounter.npc.ship.hull} / {npcShipType.hullStrength}
      </div>
      <div>
        Fighter: {encounter.npc.fighterSkill} | Pilot: {encounter.npc.pilotSkill}
      </div>
      {npcWeapons.length > 0 && <div>Weapons: {npcWeapons.join(', ')}</div>}
      {npcShields.length > 0 && <div>Shields: {npcShields.join(', ')}</div>}
    </div>
  );

  return (
    <GameModal
      isOpen={!!encounter}
      onClose={() => {}}
      title={modalTitle}
      footer={footer}
      titleRight={
        <InformationButton
          onClick={() => setShowInfo((v) => !v)}
          style={{
            position: 'relative',
            right: 'auto',
            background: showInfo ? '#fff' : 'rgba(255,255,255,0.3)',
            color: showInfo ? '#330099' : '#fff',
          }}
        />
      }
    >
      {showInfo ? (
        infoPanel
      ) : (
        <>
          {/* Ship visuals: graphical sprites or textual stats */}
          {optTextualEncounters ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                columnGap: '12px',
                marginBottom: '10px',
                fontSize: '12px',
                fontFamily: 'monospace',
                lineHeight: '1.5',
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>You</div>
                <div>{playerShipType.name}</div>
                <div>
                  Hull at{' '}
                  {playerShipType.hullStrength > 0
                    ? Math.round((ship.hull / playerShipType.hullStrength) * 100)
                    : 100}
                  %
                </div>
                <div>
                  {ship.shield.some((s) => s >= 0)
                    ? ship.shield
                        .filter((s) => s >= 0)
                        .map((s) => Shields[s]?.name ?? '?')
                        .join(', ')
                    : 'No shields'}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>Opponent</div>
                <div>{npcShipType.name}</div>
                <div>
                  Hull at{' '}
                  {npcShipType.hullStrength > 0
                    ? Math.round((encounter.npc.ship.hull / npcShipType.hullStrength) * 100)
                    : 100}
                  %
                </div>
                <div>
                  {encounter.npc.ship.shield.some((s) => s >= 0)
                    ? encounter.npc.ship.shield
                        .filter((s) => s >= 0)
                        .map((s) => Shields[s]?.name ?? '?')
                        .join(', ')
                    : 'No shields'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              {/* Encounter type icon — top right */}
              <div style={{ position: 'absolute', top: 0, right: 0 }}>
                <EncounterIcon type={encounter.type} />
              </div>
              {/* Ships side by side */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  paddingTop: '4px',
                }}
              >
                <ColoredShip
                  spriteIndex={ship.type}
                  scale={2}
                  baseFilter={FILTER_BLUE}
                  damageRatio={playerDamageRatio}
                />
                <ColoredShip
                  spriteIndex={encounter.npc.ship.type}
                  scale={2}
                  baseFilter={FILTER_GREEN}
                  damageRatio={npcDamageRatio}
                  flip
                />
              </div>
            </div>
          )}

          {/* Narrative text */}
          <div style={{ marginBottom: '8px' }}>
            {narrativeLines.map((line, i) => (
              <p key={i} style={{ margin: '0 0 4px', fontSize: '12px', lineHeight: '1.4' }}>
                {line}
              </p>
            ))}
          </div>

          {/* Last combat log message */}
          {lastMessage && (
            <div
              style={{
                fontSize: '11px',
                borderTop: '1px solid #ccc',
                paddingTop: '6px',
                color: '#555',
                fontStyle: 'italic',
              }}
            >
              {lastMessage}
            </div>
          )}
        </>
      )}
    </GameModal>
  );
};
