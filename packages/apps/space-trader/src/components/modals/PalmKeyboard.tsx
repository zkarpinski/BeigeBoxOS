import React, { useState } from 'react';

interface PalmKeyboardProps {
  initialValue?: string;
  maxLength?: number;
  onComplete: (value: string) => void;
  onCancel: () => void;
}

export const PalmKeyboard: React.FC<PalmKeyboardProps> = ({
  initialValue = '',
  maxLength = 32,
  onComplete,
  onCancel,
}) => {
  const [value, setValue] = useState(initialValue);
  const [mode, setMode] = useState<'abc' | '123' | 'intl'>('abc');
  const [shifted, setShifted] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const handleKey = (key: string) => {
    if (value.length < maxLength) {
      let char = key;
      if (mode === 'abc' && key.length === 1 && /[a-z]/i.test(key)) {
        if (shifted || capsLock) {
          char = char.toUpperCase();
        } else {
          char = char.toLowerCase();
        }
      }
      setValue((v) => v + char);
      if (shifted) setShifted(false);
    }
  };

  const handleBackspace = () => {
    setValue((v) => v.slice(0, -1));
  };

  const isDark = (m: string) => mode === m;

  return (
    <div
      className="palm-keyboard-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255,255,255,0.7)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '240px', // Standard Palm screen height is 320, keyboard takes up bottom portion
          background: 'white',
          borderTop: '2px solid black',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: '#0000aa',
            color: 'white',
            padding: '2px 4px',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
          }}
        >
          <span>Keyboard</span>
          <span
            style={{
              border: '1px solid white',
              borderRadius: '50%',
              width: '12px',
              height: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
            }}
          >
            i
          </span>
        </div>

        <div style={{ padding: '6px' }}>
          <div
            style={{
              borderBottom: '1px dotted #888',
              paddingBottom: '2px',
              fontSize: '14px',
              fontFamily: 'monospace',
              minHeight: '18px',
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {mode === 'abc' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map((k) => (
                  <Key key={k} label={k} onClick={() => handleKey(k)} upper={shifted || capsLock} />
                ))}
                <Key label="⬅" onClick={handleBackspace} style={{ flex: 1.5 }} />
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <Key label="⇥" onClick={() => handleKey('  ')} style={{ flex: 1.2 }} />
                {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"].map((k) => (
                  <Key key={k} label={k} onClick={() => handleKey(k)} upper={shifted || capsLock} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <Key
                  label="cap"
                  onClick={() => setCapsLock(!capsLock)}
                  active={capsLock}
                  style={{ flex: 2 }}
                />
                {['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'].map((k) => (
                  <Key key={k} label={k} onClick={() => handleKey(k)} upper={shifted || capsLock} />
                ))}
                <Key label="↵" onClick={() => onComplete(value)} style={{ flex: 1.5 }} />
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <Key
                  label="shift"
                  onClick={() => {
                    setShifted(!shifted);
                    setCapsLock(false);
                  }}
                  active={shifted}
                  style={{ flex: 2.5 }}
                />
                <Key label="space" onClick={() => handleKey(' ')} style={{ flex: 6 }} />
                <Key label="-" onClick={() => handleKey('-')} />
                <Key label="/" onClick={() => handleKey('/')} />
              </div>
            </div>
          )}

          {mode === '123' && (
            <div style={{ display: 'flex', gap: '4px', height: '80px' }}>
              <div
                style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1px',
                  border: '1px solid black',
                }}
              >
                {[
                  '$',
                  '€',
                  '£',
                  '¥',
                  '[',
                  ']',
                  '{',
                  '}',
                  '<',
                  '>',
                  '\\',
                  '=',
                  '@',
                  '~',
                  '&',
                  '#',
                ].map((k) => (
                  <Key key={k} label={k} onClick={() => handleKey(k)} isGrid />
                ))}
              </div>
              <div
                style={{
                  flex: 0.8,
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
              <div
                style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1px',
                  border: '1px solid black',
                }}
              >
                <Key label="-" onClick={() => handleKey('-')} isGrid />
                <Key label="+" onClick={() => handleKey('+')} isGrid />
                <Key label="⬅" onClick={handleBackspace} isGrid style={{ gridColumn: 'span 2' }} />

                <Key label="/" onClick={() => handleKey('/')} isGrid />
                <Key label="*" onClick={() => handleKey('*')} isGrid />
                <Key label=":" onClick={() => handleKey(':')} isGrid />
                <Key label="⇥" onClick={() => handleKey('  ')} isGrid />

                <Key label="." onClick={() => handleKey('.')} isGrid />
                <Key label="," onClick={() => handleKey(',')} isGrid />
                <Key label="'" onClick={() => handleKey("'")} isGrid />
                <Key label="↵" onClick={() => onComplete(value)} isGrid />

                <Key
                  label="space"
                  onClick={() => handleKey(' ')}
                  isGrid
                  style={{ gridColumn: 'span 3' }}
                />
                <Key label="%" onClick={() => handleKey('%')} isGrid />
              </div>
            </div>
          )}

          {mode === 'intl' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '80px',
                border: '1px solid black',
              }}
            >
              Not implemented
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            padding: '4px',
            gap: '8px',
            borderTop: '2px solid black',
            backgroundColor: 'white',
          }}
        >
          <button
            onClick={() => onComplete(value)}
            style={{
              borderRadius: '8px',
              border: '2px solid black',
              padding: '0 12px',
              background: 'white',
              fontWeight: 'bold',
            }}
          >
            Done
          </button>

          <div style={{ display: 'flex', border: '2px solid black' }}>
            <button
              onClick={() => setMode('abc')}
              style={{
                background: isDark('abc') ? '#0000aa' : 'white',
                color: isDark('abc') ? 'white' : 'black',
                border: 'none',
                padding: '0 6px',
                fontWeight: 'bold',
              }}
            >
              abc
            </button>
            <div style={{ width: '1px', background: 'black' }} />
            <button
              onClick={() => setMode('123')}
              style={{
                background: isDark('123') ? '#0000aa' : 'white',
                color: isDark('123') ? 'white' : 'black',
                border: 'none',
                padding: '0 6px',
              }}
            >
              123
            </button>
            <div style={{ width: '1px', background: 'black' }} />
            <button
              onClick={() => setMode('intl')}
              style={{
                background: isDark('intl') ? '#0000aa' : 'white',
                color: isDark('intl') ? 'white' : 'black',
                border: 'none',
                padding: '0 6px',
              }}
            >
              Int'l
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function Key({
  label,
  onClick,
  upper,
  style,
  active,
  isGrid,
}: {
  label: string;
  onClick: () => void;
  upper?: boolean;
  style?: any;
  active?: boolean;
  isGrid?: boolean;
}) {
  const displayLabel = upper && label.length === 1 ? label.toUpperCase() : label;

  if (isGrid) {
    return (
      <button
        onClick={onClick}
        style={{
          background: 'white',
          border: 'none',
          outline: '1px solid black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          padding: 0,
          margin: 0,
          ...style,
        }}
      >
        {displayLabel}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? 'black' : 'white',
        color: active ? 'white' : 'black',
        border: '1px solid black',
        height: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: label.length > 1 ? '10px' : '12px',
        fontFamily: 'monospace',
        cursor: 'pointer',
        padding: 0,
        ...style,
      }}
    >
      {displayLabel}
    </button>
  );
}
