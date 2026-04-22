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
  getTotalShieldStrength,
} from '../../logic/Encounter';
import { SHIP_SPRITES } from '../../assets/ships/ShipSprites';
import { GameModal } from '../modals/GameModal';
import { InformationButton } from '../common/InformationButton';

/**
 * SVG filter definitions for ship rendering states.
 * Sprites now have multi-color fills baked in, so normal rendering needs no filter.
 * Only damage (red recolor) and shield (gold glow) need filters.
 */
function ShipFilterDefs() {
  return (
    <svg
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <defs>
        {/* Damage filter: recolor all pixels red via SourceAlpha */}
        <filter id="ship-damage">
          <feFlood floodColor="#cc4444" result="damageColor" />
          <feComposite in="damageColor" in2="SourceAlpha" operator="in" />
        </filter>
        {/* Shield filter: gold glow around the ship (React 18 compatible) */}
        <filter id="ship-shield" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
          <feFlood floodColor="#ccaa00" floodOpacity="0.8" result="gold" />
          <feComposite in="gold" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

/**
 * Renders a ship sprite with 3-region horizontal compositing,
 * matching the original PalmOS ShowShip() in Encounter.c.
 *
 * Sprites have multi-color fills baked in — no filter needed for normal state.
 * Damage (red) uses SourceAlpha filter. Shield adds a gold glow.
 *
 * Three horizontal regions (left-to-right):
 * - Left:  damaged, no shield (worst state) — red filter
 * - Mid:   intact no-shield OR damaged shielded
 * - Right: intact + shielded (best state) — gold glow
 */
function ColoredShip({
  spriteIndex,
  scale,
  damageRatio,
  shieldRatio,
  flip,
}: {
  spriteIndex: number;
  scale: number;
  damageRatio: number;
  shieldRatio: number;
  flip?: boolean;
}) {
  const Sprite = SHIP_SPRITES[spriteIndex] ?? SHIP_SPRITES[0];

  const dmgPct = damageRatio * 100;
  const shieldPct = (1 - shieldRatio) * 100;
  const hasDamage = damageRatio > 0;
  const hasShield = shieldRatio > 0;

  // Simple case: no damage and no shields — render baked-in colors directly
  if (!hasDamage && !hasShield) {
    return (
      <div
        style={{
          display: 'inline-block',
          transform: flip ? 'scaleX(-1)' : undefined,
          lineHeight: 0,
        }}
      >
        <Sprite scale={scale} />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        transform: flip ? 'scaleX(-1)' : undefined,
        lineHeight: 0,
      }}
    >
      {/* Region 1 (leftmost): damaged, no shield — red recolor */}
      {hasDamage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            clipPath: `inset(0 ${100 - Math.min(dmgPct, shieldPct)}% 0 0)`,
          }}
        >
          <Sprite scale={scale} style={{ filter: 'url(#ship-damage)' }} />
        </div>
      )}

      {/* Region 2 (middle): intact no-shield OR damaged shielded */}
      {dmgPct !== shieldPct && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            clipPath: `inset(0 ${100 - Math.max(dmgPct, shieldPct)}% 0 ${Math.min(dmgPct, shieldPct)}%)`,
          }}
        >
          {dmgPct < shieldPct ? (
            <Sprite scale={scale} />
          ) : (
            <Sprite scale={scale} style={{ filter: 'url(#ship-damage)' }} />
          )}
        </div>
      )}

      {/* Region 3 (rightmost): intact + shielded — gold glow */}
      <div
        style={{
          clipPath: hasShield
            ? `inset(0 0 0 ${Math.max(dmgPct, shieldPct)}%)`
            : hasDamage
              ? `inset(0 0 0 ${dmgPct}%)`
              : undefined,
        }}
      >
        <Sprite scale={scale} style={hasShield ? { filter: 'url(#ship-shield)' } : undefined} />
      </div>
    </div>
  );
}

/**
 * Pixel-art encounter icons matching the original PalmOS bitmaps.
 * PirateBitmapFamily=9500, PoliceBitmapFamily=9600, TraderBitmapFamily=9700
 */
function PirateIcon() {
  // Skull and crossbones on dark purple background
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 14 14"
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect width="14" height="14" fill="#330066" />
      {/* Skull */}
      <g fill="#ffffff">
        <rect x={5} y={1} width={4} height={1} />
        <rect x={4} y={2} width={6} height={1} />
        <rect x={4} y={3} width={6} height={1} />
        <rect x={4} y={4} width={6} height={1} />
        <rect x={5} y={5} width={4} height={1} />
        <rect x={6} y={6} width={2} height={1} />
        <rect x={5} y={7} width={4} height={1} />
      </g>
      {/* Eye sockets */}
      <g fill="#330066">
        <rect x={5} y={3} width={2} height={2} />
        <rect x={8} y={3} width={2} height={2} />
      </g>
      {/* Crossbones */}
      <g fill="#ffffff">
        <rect x={3} y={9} width={1} height={1} />
        <rect x={10} y={9} width={1} height={1} />
        <rect x={4} y={10} width={1} height={1} />
        <rect x={9} y={10} width={1} height={1} />
        <rect x={5} y={11} width={4} height={1} />
        <rect x={4} y={12} width={1} height={1} />
        <rect x={9} y={12} width={1} height={1} />
        <rect x={3} y={13} width={1} height={1} />
        <rect x={10} y={13} width={1} height={1} />
      </g>
    </svg>
  );
}

function PoliceIcon() {
  // Gold badge/star on blue background
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 14 14"
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect width="14" height="14" fill="#000088" />
      {/* Badge shield shape */}
      <g fill="#ccaa00">
        <rect x={4} y={1} width={6} height={1} />
        <rect x={3} y={2} width={8} height={1} />
        <rect x={3} y={3} width={8} height={1} />
        <rect x={3} y={4} width={8} height={1} />
        <rect x={3} y={5} width={8} height={1} />
        <rect x={4} y={6} width={6} height={1} />
        <rect x={4} y={7} width={6} height={1} />
        <rect x={5} y={8} width={4} height={1} />
        <rect x={5} y={9} width={4} height={1} />
        <rect x={6} y={10} width={2} height={1} />
        <rect x={6} y={11} width={2} height={1} />
      </g>
      {/* Star cutout */}
      <g fill="#ffffff">
        <rect x={7} y={3} width={1} height={1} />
        <rect x={6} y={4} width={3} height={1} />
        <rect x={5} y={5} width={5} height={1} />
        <rect x={6} y={6} width={3} height={1} />
        <rect x={6} y={7} width={1} height={1} />
        <rect x={8} y={7} width={1} height={1} />
      </g>
    </svg>
  );
}

function TraderIcon() {
  // Green dollar/trade icon on dark green background
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 14 14"
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect width="14" height="14" fill="#005500" />
      {/* Coin/circle */}
      <g fill="#44cc44">
        <rect x={5} y={2} width={4} height={1} />
        <rect x={4} y={3} width={6} height={1} />
        <rect x={3} y={4} width={8} height={1} />
        <rect x={3} y={5} width={8} height={1} />
        <rect x={3} y={6} width={8} height={1} />
        <rect x={3} y={7} width={8} height={1} />
        <rect x={3} y={8} width={8} height={1} />
        <rect x={3} y={9} width={8} height={1} />
        <rect x={4} y={10} width={6} height={1} />
        <rect x={5} y={11} width={4} height={1} />
      </g>
      {/* $ symbol */}
      <g fill="#005500">
        <rect x={7} y={3} width={1} height={1} />
        <rect x={5} y={4} width={4} height={1} />
        <rect x={5} y={5} width={1} height={1} />
        <rect x={5} y={6} width={4} height={1} />
        <rect x={9} y={7} width={1} height={1} />
        <rect x={9} y={8} width={1} height={1} />
        <rect x={5} y={9} width={4} height={1} />
        <rect x={7} y={10} width={1} height={1} />
      </g>
    </svg>
  );
}

function AlienIcon() {
  // Red alien/mantis icon
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 14 14"
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect width="14" height="14" fill="#880000" />
      <g fill="#ff4444">
        <rect x={4} y={2} width={2} height={1} />
        <rect x={8} y={2} width={2} height={1} />
        <rect x={3} y={3} width={3} height={1} />
        <rect x={8} y={3} width={3} height={1} />
        <rect x={3} y={4} width={8} height={1} />
        <rect x={4} y={5} width={6} height={1} />
        <rect x={5} y={6} width={4} height={1} />
        <rect x={5} y={7} width={4} height={1} />
        <rect x={4} y={8} width={6} height={1} />
        <rect x={3} y={9} width={3} height={1} />
        <rect x={8} y={9} width={3} height={1} />
        <rect x={3} y={10} width={2} height={1} />
        <rect x={9} y={10} width={2} height={1} />
      </g>
      {/* Eyes */}
      <g fill="#ffffff">
        <rect x={5} y={4} width={1} height={1} />
        <rect x={8} y={4} width={1} height={1} />
      </g>
    </svg>
  );
}

function EncounterIcon({ type }: { type: string }) {
  if (type === ENCOUNTER_PIRATE) return <PirateIcon />;
  if (type === ENCOUNTER_POLICE) return <PoliceIcon />;
  if (type === ENCOUNTER_MONSTER || type === ENCOUNTER_DRAGONFLY || type === ENCOUNTER_SCARAB)
    return <AlienIcon />;
  return <TraderIcon />;
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
  fontSize: '11px',
  fontFamily: 'inherit',
  padding: '2px 14px',
  borderRadius: '12px',
  border: '1px solid #000',
  background: '#fff',
  color: '#000',
  cursor: 'pointer',
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

  // Shield ratios: current shield strength / max possible shield strength
  // Guard against old persisted state missing shieldStrength
  const safeShieldStrength = (s: typeof ship) => (s.shieldStrength ? getTotalShieldStrength(s) : 0);
  const playerMaxShields = (ship.shield ?? []).reduce(
    (sum: number, id: number) => sum + (id >= 0 && Shields[id] ? Shields[id].power : 0),
    0,
  );
  const playerShieldRatio =
    playerMaxShields > 0
      ? Math.max(0, Math.min(1, safeShieldStrength(ship) / playerMaxShields))
      : 0;
  const npcMaxShields = (encounter.npc.ship.shield ?? []).reduce(
    (sum: number, id: number) => sum + (id >= 0 && Shields[id] ? Shields[id].power : 0),
    0,
  );
  const npcShieldRatio =
    npcMaxShields > 0
      ? Math.max(0, Math.min(1, safeShieldStrength(encounter.npc.ship) / npcMaxShields))
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
            color: showInfo ? '#1a1a8c' : '#fff',
          }}
        />
      }
    >
      <ShipFilterDefs />
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
                  damageRatio={playerDamageRatio}
                  shieldRatio={playerShieldRatio}
                />
                <ColoredShip
                  spriteIndex={encounter.npc.ship.type}
                  scale={2}
                  damageRatio={npcDamageRatio}
                  shieldRatio={npcShieldRatio}
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
