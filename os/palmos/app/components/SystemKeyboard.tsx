'use client';

import React, { useState } from 'react';

interface SystemKeyboardProps {
  onClose: () => void;
}

export function SystemKeyboard({ onClose }: SystemKeyboardProps) {
  const [value, setValue] = useState('');
  const [mode, setMode] = useState<'abc' | '123'>('abc');
  const [shifted, setShifted] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const handleKey = (key: string) => {
    let char = key;
    if (mode === 'abc' && key.length === 1 && /[a-z]/i.test(key)) {
      char = shifted || capsLock ? char.toUpperCase() : char.toLowerCase();
    }
    setValue((v) => v + char);
    if (shifted) setShifted(false);
  };

  const handleBackspace = () => setValue((v) => v.slice(0, -1));

  const handleDone = () => {
    // Dispatch typed text to the currently focused element
    const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    if (el && 'value' in el) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(el),
        'value',
      )?.set;
      const newValue = el.value + value;
      nativeInputValueSetter?.call(el, newValue);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    onClose();
  };

  const isDark = (m: string) => mode === m;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.25)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: '100%',
          background: 'white',
          borderTop: '2px solid black',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: '#1A1A8C',
            color: 'white',
            padding: '2px 6px',
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Keyboard</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid white',
              color: 'white',
              fontSize: '9px',
              padding: '0 4px',
              cursor: 'pointer',
              lineHeight: '14px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Current value preview */}
        <div
          style={{
            padding: '3px 6px',
            borderBottom: '1px dotted #888',
            fontSize: '12px',
            fontFamily: 'monospace',
            minHeight: '18px',
            color: '#000',
          }}
        >
          {value || <span style={{ color: '#aaa' }}>...</span>}
        </div>

        {/* Keys */}
        <div style={{ padding: '3px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {mode === 'abc' && (
            <>
              <Row
                keys={['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']}
                onKey={handleKey}
                upper={shifted || capsLock}
                extra={<Key label="⬅" onClick={handleBackspace} w={1.5} />}
              />
              <Row
                keys={['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"]}
                onKey={handleKey}
                upper={shifted || capsLock}
              />
              <div style={{ display: 'flex', gap: '2px' }}>
                <Key label="cap" onClick={() => setCapsLock(!capsLock)} w={2} active={capsLock} />
                {['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'].map((k) => (
                  <Key
                    key={k}
                    label={shifted || capsLock ? k.toUpperCase() : k}
                    onClick={() => handleKey(k)}
                  />
                ))}
                <Key label="↵" onClick={handleDone} w={1.5} />
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <Key
                  label="shift"
                  onClick={() => {
                    setShifted(!shifted);
                    setCapsLock(false);
                  }}
                  w={2.5}
                  active={shifted}
                />
                <Key label="space" onClick={() => handleKey(' ')} w={6} />
                <Key label="-" onClick={() => handleKey('-')} />
                <Key label="/" onClick={() => handleKey('/')} />
              </div>
            </>
          )}

          {mode === '123' && (
            <div style={{ display: 'flex', gap: '3px', height: '72px' }}>
              {/* Symbol grid */}
              <div
                style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1px',
                  border: '1px solid black',
                }}
              >
                {['$', '€', '[', ']', '{', '}', '<', '>', '@', '~', '&', '#'].map((k) => (
                  <Key key={k} label={k} onClick={() => handleKey(k)} isGrid />
                ))}
              </div>
              {/* Number grid */}
              <div
                style={{
                  flex: 0.75,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1px',
                  border: '1px solid black',
                }}
              >
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '(', '0', ')'].map((k) => (
                  <Key key={k} label={k} onClick={() => handleKey(k)} isGrid />
                ))}
              </div>
              {/* Ops grid */}
              <div
                style={{
                  flex: 0.75,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1px',
                  border: '1px solid black',
                }}
              >
                {['-', '+', '/', '*', '.', '↵'].map((k) => (
                  <Key
                    key={k}
                    label={k}
                    onClick={k === '↵' ? handleDone : () => handleKey(k)}
                    isGrid
                  />
                ))}
                <Key label="⬅" onClick={handleBackspace} isGrid style={{ gridColumn: 'span 2' }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{ display: 'flex', padding: '3px 4px', gap: '6px', borderTop: '1px solid black' }}
        >
          <button
            onClick={handleDone}
            style={{
              border: '2px solid black',
              background: 'white',
              padding: '0 10px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            Done
          </button>
          <div style={{ display: 'flex', border: '1px solid black' }}>
            {(['abc', '123'] as const).map((m, i) => (
              <React.Fragment key={m}>
                {i > 0 && <div style={{ width: '1px', background: 'black' }} />}
                <button
                  onClick={() => setMode(m)}
                  style={{
                    background: isDark(m) ? '#1A1A8C' : 'white',
                    color: isDark(m) ? 'white' : 'black',
                    border: 'none',
                    padding: '0 6px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {m}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  keys,
  onKey,
  upper,
  extra,
}: {
  keys: string[];
  onKey: (k: string) => void;
  upper?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {keys.map((k) => (
        <Key key={k} label={upper ? k.toUpperCase() : k} onClick={() => onKey(k)} />
      ))}
      {extra}
    </div>
  );
}

function Key({
  label,
  onClick,
  w = 1,
  active,
  isGrid,
  style,
}: {
  label: string;
  onClick: () => void;
  w?: number;
  active?: boolean;
  isGrid?: boolean;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    background: active ? '#333' : 'white',
    color: active ? 'white' : 'black',
    border: '1px solid #555',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: label.length > 1 ? '9px' : '11px',
    cursor: 'pointer',
    padding: 0,
    flex: w,
    fontFamily: 'monospace',
    ...style,
  };

  if (isGrid) {
    return (
      <button
        onClick={onClick}
        style={{ ...base, height: '100%', border: 'none', outline: '1px solid #aaa' }}
      >
        {label}
      </button>
    );
  }

  return (
    <button onClick={onClick} style={base}>
      {label}
    </button>
  );
}
