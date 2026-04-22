import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSpaceTraderGame } from '../useSpaceTraderGame';
import { getAiDecision, findBestTrade, AiAction } from './strategy';
import { ShipTypes, TradeItems, SystemNames } from '../DataTypes';
import { SpaceTraderState } from '../store/types';
import { ViewType } from '../DataTypes';

type AppView = ViewType | 'gameOver';

const MOBILE_BREAKPOINT = 600;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export const AiController: React.FC = () => {
  const state = useSpaceTraderGame();
  const { isAiEnabled, toggleAi } = state;
  const isMobile = useIsMobile();
  const [log, setLog] = useState<string[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [logExpanded, setLogExpanded] = useState(false);
  const [speed, setSpeed] = useState<number>(1500);
  const actionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const addLog = (msg: string) => {
    setLog((prev) => [msg, ...prev].slice(0, 200));
  };

  const highlightButton = (label: string | string[]): boolean => {
    const selectors =
      '.palm-btn, .qty-box, .map-dot, .shortcut-btn, .palm-shortcut-btn, button, [role="button"]';
    const allBtns = Array.from(document.querySelectorAll(selectors));
    const btns = allBtns.filter((b) => !b.closest('.title-bar') && !b.closest('.win-title-bar'));

    const labels = Array.isArray(label) ? label : [label];
    const target = btns.find((b) => {
      const text = b.textContent?.toLowerCase().trim() || '';
      if (!text) return false;
      return labels.some((l) => {
        const cleanL = l.toLowerCase().trim();
        return text === cleanL || text.includes(cleanL) || cleanL.includes(text);
      });
    });

    if (target) {
      target.classList.add('ai-highlight');
      setTimeout(() => target.classList.remove('ai-highlight'), 600);

      const rect = target.getBoundingClientRect();
      const tap = document.createElement('div');
      tap.className = 'stylus-tap';
      const x = rect.left + window.scrollX + rect.width / 2 - 15;
      const y = rect.top + window.scrollY + rect.height / 2 - 15;
      tap.style.position = 'absolute';
      tap.style.left = `${x}px`;
      tap.style.top = `${y}px`;
      tap.style.zIndex = '2147483647';
      document.body.appendChild(tap);
      setTimeout(() => tap.remove(), 550);
    }
    return !!target;
  };

  const ensureView = (targetView: AppView, currentState: SpaceTraderState): boolean => {
    if (currentState.activeView === targetView) return false;
    addLog(`→ ${targetView}`);
    state.setActiveView(targetView as ViewType);
    return true;
  };

  const ensureTradeMode = (targetMode: 'buy' | 'sell', currentState: SpaceTraderState): boolean => {
    if (currentState.activeView === 'trade' && currentState.tradeMode === targetMode) return false;
    if (ensureView('trade', currentState)) return true;
    addLog(`→ ${targetMode} mode`);
    state.setTradeMode(targetMode);
    return true;
  };

  useEffect(() => {
    if (!isAiEnabled) {
      if (actionTimeout.current) clearTimeout(actionTimeout.current);
      return;
    }

    const runAi = () => {
      const currentState = useSpaceTraderGame.getState();
      const decision = getAiDecision(currentState);

      // Navigate to the correct view before acting
      let navigated = false;
      if (decision.type !== 'ENCOUNTER_ACTION') {
        switch (decision.type) {
          case 'BUY':
            navigated = ensureTradeMode('buy', currentState);
            break;
          case 'SELL':
            navigated = ensureTradeMode('sell', currentState);
            break;
          case 'WARP':
            navigated = ensureView('map', currentState);
            break;
          case 'FUEL':
          case 'REPAIR':
          case 'BUY_SHIP':
          case 'BUY_WEAPON':
          case 'BUY_SHIELD':
          case 'BUY_ESCAPE_POD':
            navigated = ensureView('shipyard', currentState);
            break;
          case 'SPECIAL_EVENT':
            navigated = ensureView('specialEvent', currentState);
            break;
        }
      }

      const scheduleNext = () => {
        const variance = Math.random() * 300;
        actionTimeout.current = setTimeout(runAi, speed + variance);
      };

      if (navigated) {
        scheduleNext();
        return;
      }

      const buttonLabel = getDecisionButton(decision);
      if (buttonLabel) {
        highlightButton(buttonLabel);
        actionTimeout.current = setTimeout(() => {
          executeDecision(decision, currentState);
          scheduleNext();
        }, 400);
      } else {
        executeDecision(decision, currentState);
        scheduleNext();
      }
    };

    runAi();

    return () => {
      if (actionTimeout.current) clearTimeout(actionTimeout.current);
    };
  }, [isAiEnabled, speed]);

  const getDecisionButton = (decision: AiAction): string | string[] | null => {
    switch (decision.type) {
      case 'BUY':
        return ['Max', 'Buy'];
      case 'SELL':
        return ['All', 'Sell'];
      case 'WARP':
        return 'Warp';
      case 'FUEL':
        return ['Buy Fuel', 'Full Tank', 'Fuel'];
      case 'REPAIR':
        return ['Repair', 'Full Repairs'];
      case 'BUY_SHIP':
        return 'Buy';
      case 'BUY_WEAPON':
        return 'Buy';
      case 'BUY_SHIELD':
        return 'Buy';
      case 'BUY_ESCAPE_POD':
        return 'Buy';
      case 'ENCOUNTER_ACTION': {
        const { action } = decision;
        if (action === 'DONE') return ['OK', 'Done'];
        if (action === 'FLEE') return ['Flee', 'Run'];
        if (action === 'ATTACK') return ['Attack', 'Fight'];
        if (action === 'SURRENDER') return ['Surrender', 'Submit'];
        if (action === 'IGNORE') return ['Ignore', 'Pass'];
        if (action === 'LOOT') return ['Loot', 'Plunder'];
        if (action === 'LET_GO') return ['Let go', 'Pass'];
        return null;
      }
      default:
        return null;
    }
  };

  const executeDecision = (decision: AiAction, _currentState: SpaceTraderState) => {
    switch (decision.type) {
      case 'BUY':
        addLog(`Buy ${decision.amount}x ${TradeItems[decision.goodId]?.name ?? decision.goodId}`);
        state.buyGood(decision.goodId, decision.amount);
        break;

      case 'SELL':
        addLog(`Sell ${decision.amount}x ${TradeItems[decision.goodId]?.name ?? decision.goodId}`);
        state.sellGood(decision.goodId, decision.amount);
        break;

      case 'WARP':
        addLog(
          `Warp → ${SystemNames[state.systems[decision.systemId]?.nameIndex] ?? decision.systemId}`,
        );
        state.travelTo(decision.systemId);
        break;

      case 'FUEL':
        addLog(`Refuel +${decision.amount}`);
        state.buyFuel(decision.amount);
        break;

      case 'REPAIR':
        addLog(`Repair hull`);
        state.repairHull();
        break;

      case 'BUY_SHIP':
        addLog(`Buy ${ShipTypes[decision.shipTypeId]?.name ?? decision.shipTypeId}`);
        state.buyShip(decision.shipTypeId);
        break;

      case 'BUY_WEAPON':
        addLog(`Buy weapon slot`);
        state.buyWeapon(decision.weaponId);
        break;

      case 'BUY_SHIELD':
        addLog(`Buy shield slot`);
        state.buyShield(decision.shieldId);
        break;

      case 'BUY_ESCAPE_POD':
        addLog(`Buy escape pod`);
        state.buyEscapePod();
        break;

      case 'ENCOUNTER_ACTION':
        addLog(`Encounter: ${decision.action}`);
        switch (decision.action) {
          case 'ATTACK':
            state.attackInEncounter();
            break;
          case 'FLEE':
            state.fleeFromEncounter();
            break;
          case 'SURRENDER':
            state.surrenderToEncounter();
            break;
          case 'IGNORE':
            state.ignoreEncounter();
            break;
          case 'LOOT':
            state.lootNPC();
            break;
          case 'LET_GO':
            state.letNPCGo();
            break;
          case 'DONE':
            state.clearEncounter();
            break;
        }
        break;

      case 'SPECIAL_EVENT':
        addLog(`Special event`);
        state.triggerSpecialEvent(state.currentSystem);
        break;
    }
  };

  // Compute current goal for display
  const goal = (() => {
    if (!isAiEnabled || !state.systems?.length) return null;
    if (state.credits >= 500000) return 'Heading to Utopia → buy the moon!';
    const best = findBestTrade(state);
    if (!best) return 'Exploring for trades...';
    const itemName = TradeItems[best.goodId]?.name ?? best.goodId;
    const destName =
      SystemNames[state.systems[best.targetSystemId]?.nameIndex] ?? best.targetSystemId;
    return `${itemName} → ${destName} (~${best.profit}cr/unit)`;
  })();

  const sharedStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.92)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: '11px',
        zIndex: 10000,
        borderTop: '1px solid #0a0',
      }
    : {
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.88)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: '11px',
        zIndex: 10000,
        border: '1px solid #0a0',
        borderRadius: '6px',
        width: '230px',
      };

  // Portal escapes the BeigeBoxOS transform container so position:fixed is truly viewport-relative
  const asPortal = (el: React.ReactElement) => ReactDOM.createPortal(el, document.body);

  // ── Collapsed state ────────────────────────────────────────────────────────
  // Mobile: full-width thin bar (portalled to body). Desktop: compact corner box.
  if (!panelOpen) {
    return isMobile ? (
      asPortal(
        // Mobile bar
        <div
          style={{
            ...sharedStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
          }}
        >
          {/* Status dot */}
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isAiEnabled ? '#0f0' : '#040',
              flexShrink: 0,
              boxShadow: isAiEnabled ? '0 0 4px #0f0' : 'none',
            }}
          />

          {/* Label + last action */}
          <span style={{ fontWeight: 'bold', letterSpacing: '1px', flexShrink: 0 }}>AI</span>
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#080',
              fontSize: '10px',
            }}
          >
            {isAiEnabled ? (log[0] ?? 'running...') : 'off'}
          </span>

          {/* Start/Stop */}
          <button
            onClick={toggleAi}
            style={{
              background: isAiEnabled ? '#500' : '#040',
              color: isAiEnabled ? '#f88' : '#0d0',
              border: `1px solid ${isAiEnabled ? '#800' : '#0a0'}`,
              padding: '1px 6px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '9px',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            {isAiEnabled ? 'STOP' : 'START'}
          </button>

          {/* Expand */}
          <button
            onClick={() => setPanelOpen(true)}
            style={{
              background: 'none',
              border: '1px solid #040',
              color: '#060',
              padding: '1px 5px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '9px',
              flexShrink: 0,
            }}
          >
            ▲
          </button>
        </div>,
      )
    ) : (
      // Desktop corner box (collapsed) — no portal needed
      <div style={{ ...sharedStyle, padding: '8px 10px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isAiEnabled ? '#0f0' : '#040',
              flexShrink: 0,
              boxShadow: isAiEnabled ? '0 0 4px #0f0' : 'none',
            }}
          />
          <span style={{ fontWeight: 'bold', letterSpacing: '1px', flexShrink: 0 }}>AI CORE</span>
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#080',
              fontSize: '10px',
            }}
          >
            {isAiEnabled ? (log[0] ?? 'running...') : 'off'}
          </span>
          <button
            onClick={toggleAi}
            style={{
              background: isAiEnabled ? '#500' : '#040',
              color: isAiEnabled ? '#f88' : '#0d0',
              border: `1px solid ${isAiEnabled ? '#800' : '#0a0'}`,
              padding: '1px 6px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '9px',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            {isAiEnabled ? 'STOP' : 'START'}
          </button>
          <button
            onClick={() => setPanelOpen(true)}
            style={{
              background: 'none',
              border: '1px solid #040',
              color: '#060',
              padding: '1px 5px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '9px',
              flexShrink: 0,
            }}
          >
            ▲
          </button>
        </div>
      </div>
    );
  }

  // ── Expanded panel ─────────────────────────────────────────────────────────
  const expandedPanel = (
    <div style={{ ...sharedStyle, padding: '10px 12px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
          borderBottom: '1px solid #040',
          paddingBottom: '4px',
          gap: '6px',
        }}
      >
        <span style={{ fontWeight: 'bold', letterSpacing: '1px' }}>AI CORE</span>

        <button
          onClick={toggleAi}
          style={{
            background: isAiEnabled ? '#500' : '#040',
            color: isAiEnabled ? '#f88' : '#0d0',
            border: `1px solid ${isAiEnabled ? '#f00' : '#0a0'}`,
            padding: '1px 8px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 'bold',
          }}
        >
          {isAiEnabled ? 'STOP' : 'START'}
        </button>

        {/* Collapse */}
        <button
          onClick={() => {
            setPanelOpen(false);
            setLogExpanded(false);
          }}
          style={{
            background: 'none',
            border: '1px solid #040',
            color: '#060',
            padding: '1px 5px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '9px',
          }}
        >
          ▼
        </button>
      </div>

      {/* Goal */}
      {isAiEnabled && goal && (
        <div
          style={{
            marginBottom: '6px',
            color: '#aa8',
            fontSize: '10px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          ⚑ {goal}
        </div>
      )}

      {/* Log */}
      <div
        style={{
          maxHeight: logExpanded ? '200px' : '66px',
          overflowY: logExpanded ? 'auto' : 'hidden',
          transition: 'max-height 0.2s ease',
        }}
      >
        {log.length === 0 ? (
          <div style={{ color: '#444' }}>Ready</div>
        ) : (
          log.map((msg, i) => (
            <div
              key={i}
              style={{
                opacity: logExpanded ? 1 : 1 - i * 0.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: i === 0 ? '#0f0' : '#080',
                lineHeight: '1.4',
              }}
            >
              {i === 0 ? '▶ ' : '  '}
              {msg}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* Log expand/collapse */}
      {log.length > 3 && (
        <button
          onClick={() => setLogExpanded((e) => !e)}
          style={{
            background: 'none',
            border: 'none',
            color: '#060',
            cursor: 'pointer',
            fontSize: '9px',
            padding: '2px 0',
            width: '100%',
            textAlign: 'left',
          }}
        >
          {logExpanded
            ? `▲ collapse (${log.length} entries)`
            : `▼ full log (${log.length} entries)`}
        </button>
      )}

      {/* Speed controls */}
      <div
        style={{
          marginTop: '8px',
          paddingTop: '6px',
          borderTop: '1px solid #040',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span style={{ color: '#060', marginRight: '2px', fontSize: '10px' }}>PACE</span>
        {(
          [
            { label: 'SLOW', val: 4000 },
            { label: 'MED', val: 1500 },
            { label: 'FAST', val: 600 },
          ] as const
        ).map((p) => (
          <button
            key={p.label}
            onClick={() => setSpeed(p.val)}
            style={{
              background: speed === p.val ? '#0a0' : '#010',
              color: speed === p.val ? '#000' : '#0a0',
              border: `1px solid ${speed === p.val ? '#0f0' : '#040'}`,
              padding: '1px 5px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '9px',
              fontWeight: 'bold',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
  return isMobile ? asPortal(expandedPanel) : expandedPanel;
};
