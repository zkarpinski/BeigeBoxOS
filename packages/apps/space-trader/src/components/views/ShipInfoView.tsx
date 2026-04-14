import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ShipTypes, Weapons, Shields, Gadgets, TradeItems, ViewType } from '../../logic/DataTypes';
import { useTitleBar } from '../TitleBarContext';

interface ShipInfoViewProps {
  onViewChange: (view: ViewType) => void;
}

function policeRecordTitle(score: number): string {
  if (score <= -100) return 'Psychopath';
  if (score <= -70) return 'Villain';
  if (score <= -30) return 'Criminal';
  if (score <= -10) return 'Dubious';
  if (score <= 4) return 'Clean';
  if (score <= 14) return 'Lawful';
  if (score <= 29) return 'Trusted';
  if (score <= 74) return 'Liked';
  return 'Hero';
}

function reputationTitle(score: number): string {
  if (score <= 0) return 'Harmless';
  if (score <= 1) return 'Mostly Harmless';
  if (score <= 4) return 'Poor';
  if (score <= 9) return 'Average';
  if (score <= 19) return 'Above Average';
  if (score <= 29) return 'Competent';
  if (score <= 59) return 'Dangerous';
  if (score <= 99) return 'Deadly';
  return 'Elite';
}

export const ShipInfoView: React.FC<ShipInfoViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const {
    ship,
    credits,
    debt,
    days,
    reputationScore,
    policeRecordScore,
    killsPirate,
    killsPolice,
    pilotSkill,
    fighterSkill,
    traderSkill,
    engineerSkill,
  } = useSpaceTraderGame();
  const shipType = ShipTypes[ship.type];

  // Effective skills: base + gadget bonuses
  const hasTargeting = ship.gadget.includes(3);
  const hasAutoRepair = ship.gadget.includes(1);
  const hasNav = ship.gadget.includes(2);
  const hasCloaking = ship.gadget.includes(4);
  const effPilot = pilotSkill + (hasNav || hasCloaking ? 3 : 0);
  const effFighter = fighterSkill + (hasTargeting ? 3 : 0);
  const effEngineer = engineerSkill + (hasAutoRepair ? 2 : 0);

  // Net worth: credits + ship trade-in (hull%) + equipment (50%) + cargo value - debt
  const hullPct = shipType.hullStrength > 0 ? ship.hull / shipType.hullStrength : 1;
  const shipValue = Math.floor(shipType.price * hullPct * 0.9);
  const weaponValue = ship.weapon
    .filter((w) => w >= 0)
    .reduce((s, w) => s + Math.floor(Weapons[w].price * 0.5), 0);
  const shieldValue = ship.shield
    .filter((s) => s >= 0)
    .reduce((s, sh) => s + Math.floor(Shields[sh].price * 0.5), 0);
  const gadgetValue = ship.gadget
    .filter((g) => g >= 0)
    .reduce((s, g) => s + Math.floor(Gadgets[g].price * 0.5), 0);
  const cargoValue = ship.cargo.reduce(
    (s: number, qty: number, id: number) => s + qty * (TradeItems[id]?.minTradePrice ?? 0),
    0,
  );
  const netWorth =
    credits + shipValue + weaponValue + shieldValue + gadgetValue + cargoValue - debt;

  const row = (label: string, value: React.ReactNode) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        padding: '1px 0',
      }}
    >
      <span style={{ color: '#555' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );

  const section = (label: string) => (
    <div
      style={{
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#000',
        borderBottom: '1px solid #000',
        marginTop: '6px',
        marginBottom: '2px',
      }}
    >
      {label}
    </div>
  );

  const skillLabel = (base: number, eff: number) =>
    eff !== base ? `${eff} (${base}+${eff - base})` : String(base);

  return (
    <div className="palm-window">
      {TitleBar && <TitleBar title="Commander Status" onViewChange={onViewChange} />}

      <div
        className="palm-content"
        style={{ padding: '4px 8px', overflowY: 'auto', fontSize: '12px' }}
      >
        {section('Commander')}
        {row('Days active', days)}
        {row('Net worth', `${netWorth} cr.`)}
        {debt > 0 && row('Debt', `${debt} cr.`)}
        {row('Kills (pirates)', killsPirate)}
        {row('Kills (police)', killsPolice)}
        {row('Reputation', `${reputationTitle(reputationScore)} (${reputationScore})`)}
        {row('Record', `${policeRecordTitle(policeRecordScore)} (${policeRecordScore})`)}

        {section('Skills')}
        {row('Pilot', skillLabel(pilotSkill, effPilot))}
        {row('Fighter', skillLabel(fighterSkill, effFighter))}
        {row('Trader', traderSkill)}
        {row('Engineer', skillLabel(engineerSkill, effEngineer))}

        {section('Ship — ' + shipType.name)}
        {row('Hull', `${ship.hull}/${shipType.hullStrength}`)}
        {row('Fuel', `${ship.fuel}/${shipType.fuelTanks} parsecs`)}
        {row(
          'Cargo',
          `${ship.cargo.reduce((a: number, b: number) => a + b, 0)}/${shipType.cargoBays} bays`,
        )}
        {row(
          'Weapons',
          ship.weapon
            .filter((w) => w >= 0)
            .map((w) => Weapons[w].name)
            .join(', ') || 'None',
        )}
        {row(
          'Shields',
          ship.shield
            .filter((s) => s >= 0)
            .map((s) => Shields[s].name)
            .join(', ') || 'None',
        )}
        {row(
          'Gadgets',
          ship.gadget
            .filter((g) => g >= 0)
            .map((g) => Gadgets[g].name)
            .join(', ') || 'None',
        )}
        {row('Escape pod', ship.escapePod ? 'Yes' : 'No')}
      </div>

      <div className="palm-footer">
        <div className="footer-nav">
          <button className="palm-btn" onClick={() => onViewChange('trade')}>
            Trade
          </button>
          <button className="palm-btn" onClick={() => onViewChange('system')}>
            System Info
          </button>
          <button className="palm-btn active" onClick={() => onViewChange('ship')}>
            Ship Info
          </button>
          <button className="palm-btn" onClick={() => onViewChange('map')}>
            Galactic Chart
          </button>
        </div>
      </div>
    </div>
  );
};
