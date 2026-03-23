'use client';

// ── Calculator inner UI ────────────────────────────────────────────────────────
// This component contains the Calculator logic and UI without any window chrome
// (no AppWindow wrapper, no shell-specific imports). Wrap it in an AppWindow in
// the os-specific layer.

import React, { useCallback, useRef, useState } from 'react';
import './calculator.css';

export interface CalculatorButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  /** Visual style: blue for numbers/utility, red for operators/clear */
  variant: 'blue' | 'red';
  /** Extra CSS classes (e.g. calc-btn-top, calc-btn-memory) */
  className?: string;
  title?: string;
  /** When true, show depressed state (e.g. from keyboard key) */
  pressed?: boolean;
}

export function CalculatorButton({
  children,
  onClick,
  variant,
  className = '',
  title,
  pressed = false,
}: CalculatorButtonProps) {
  const variantClass = variant === 'red' ? 'calc-btn-red' : 'calc-btn-blue';
  return (
    <button
      type="button"
      className={`calculator-btn ${variantClass}${className ? ` ${className}` : ''}${pressed ? ' calc-btn-keyboard-pressed' : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export interface CalculatorContentProps {
  /** Optional: receive focus automatically when visible. Pass the window visible state. */
  autoFocus?: boolean;
}

export function CalculatorContent({ autoFocus = false }: CalculatorContentProps) {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNew, setWaitingForNew] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [memory, setMemory] = useState(0);
  const [hasMemory, setHasMemory] = useState(false);
  const [error, setError] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-focus when visible
  React.useEffect(() => {
    if (autoFocus && bodyRef.current) {
      bodyRef.current.focus();
    }
  }, [autoFocus]);

  function performCalc(op: string, v1: number, v2: number): number | null {
    switch (op) {
      case 'add':
        return v1 + v2;
      case 'subtract':
        return v1 - v2;
      case 'multiply':
        return v1 * v2;
      case 'divide':
        if (v2 === 0) {
          setError(true);
          return null;
        }
        return v1 / v2;
      default:
        return v2;
    }
  }

  function fmt(n: number): string {
    return String(parseFloat(n.toFixed(10)));
  }

  function handleInput(action: string, val?: string) {
    if (error && action !== 'clear') return;

    switch (action) {
      case 'num': {
        const d = val!;
        if (waitingForNew || overwrite) {
          setDisplay(d);
          setWaitingForNew(false);
          setOverwrite(false);
        } else {
          setDisplay((cur) => (cur === '0' ? d : cur + d));
        }
        break;
      }
      case 'decimal': {
        if (waitingForNew || overwrite) {
          setDisplay('0.');
          setWaitingForNew(false);
          setOverwrite(false);
        } else {
          setDisplay((cur) => (cur.includes('.') ? cur : cur + '.'));
        }
        break;
      }
      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide': {
        const input = parseFloat(display);
        if (operator && waitingForNew && !overwrite) {
          setOperator(action);
          return;
        }
        if (prev === null) {
          setPrev(input);
        } else if (operator) {
          const result = performCalc(operator, prev, input);
          if (result === null) return;
          setDisplay(fmt(result));
          setPrev(result);
        }
        setWaitingForNew(true);
        setOverwrite(false);
        setOperator(action);
        break;
      }
      case 'equals': {
        if (!operator || (waitingForNew && !overwrite)) return;
        const input = parseFloat(display);
        const result = performCalc(operator!, prev!, input);
        if (result === null) return;
        setDisplay(fmt(result));
        setPrev(null);
        setOperator(null);
        setWaitingForNew(true);
        setOverwrite(false);
        break;
      }
      case 'sqrt': {
        const v = parseFloat(display);
        if (v < 0) {
          setError(true);
          return;
        }
        setDisplay(fmt(Math.sqrt(v)));
        setOverwrite(true);
        break;
      }
      case 'percent': {
        if (prev === null) {
          setDisplay('0');
          setOverwrite(true);
          return;
        }
        const pct = prev * (parseFloat(display) / 100);
        setDisplay(fmt(pct));
        setOverwrite(true);
        break;
      }
      case 'reciprocal': {
        const v = parseFloat(display);
        if (v === 0) {
          setError(true);
          return;
        }
        setDisplay(fmt(1 / v));
        setOverwrite(true);
        break;
      }
      case 'sign': {
        setDisplay((cur) => {
          if (cur === '0') return cur;
          return cur.startsWith('-') ? cur.slice(1) : '-' + cur;
        });
        break;
      }
      case 'backspace': {
        if (waitingForNew || overwrite) return;
        setDisplay((cur) => {
          if (cur.length <= 1) return '0';
          const next = cur.slice(0, -1);
          return next === '-' || next === '-0' ? '0' : next;
        });
        break;
      }
      case 'clear-entry': {
        setDisplay('0');
        setError(false);
        break;
      }
      case 'clear': {
        setDisplay('0');
        setPrev(null);
        setOperator(null);
        setWaitingForNew(false);
        setOverwrite(false);
        setError(false);
        break;
      }
      case 'mc': {
        setMemory(0);
        setHasMemory(false);
        break;
      }
      case 'mr': {
        if (hasMemory) {
          setDisplay(String(memory));
          setOverwrite(true);
        }
        break;
      }
      case 'ms': {
        setMemory(parseFloat(display));
        setHasMemory(true);
        setOverwrite(true);
        break;
      }
      case 'm-plus': {
        setMemory((m) => m + parseFloat(display));
        setHasMemory(true);
        setOverwrite(true);
        break;
      }
    }
  }

  const displayVal = error ? 'Error' : display;

  const handleInputRef = useRef(handleInput);
  handleInputRef.current = handleInput;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const input = handleInputRef.current;
    if (e.key >= '0' && e.key <= '9') {
      input('num', e.key);
      e.preventDefault();
      return;
    }
    switch (e.key) {
      case '+':
        input('add');
        e.preventDefault();
        break;
      case '-':
        input('subtract');
        e.preventDefault();
        break;
      case '*':
        input('multiply');
        e.preventDefault();
        break;
      case '/':
        input('divide');
        e.preventDefault();
        break;
      case 'Enter':
      case '=':
        input('equals');
        e.preventDefault();
        break;
      case '.':
        input('decimal');
        e.preventDefault();
        break;
      case 'Backspace':
        input('backspace');
        e.preventDefault();
        break;
      case 'Escape':
        input('clear');
        e.preventDefault();
        break;
      default:
        break;
    }
  }, []);

  return (
    <>
      <div className="calculator-menu-bar">
        <div className="calculator-menu-item">
          <u>E</u>dit
        </div>
        <div className="calculator-menu-item">
          <u>V</u>iew
        </div>
        <div className="calculator-menu-item">
          <u>H</u>elp
        </div>
      </div>
      <div
        ref={bodyRef}
        className="calculator-body"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseDown={() => bodyRef.current?.focus()}
        role="application"
        aria-label="Calculator"
      >
        <div className="calculator-display-container">
          <input
            type="text"
            className="calculator-display"
            value={displayVal}
            readOnly
            aria-label="Display"
            tabIndex={-1}
          />
        </div>
        <div className="calculator-keypad">
          <div className="calculator-row-top">
            <div className="calculator-spacer" />
            <CalculatorButton
              variant="red"
              className="calc-btn-top"
              onClick={() => handleInput('backspace')}
            >
              Backspace
            </CalculatorButton>
            <CalculatorButton
              variant="red"
              className="calc-btn-top"
              onClick={() => handleInput('clear-entry')}
            >
              CE
            </CalculatorButton>
            <CalculatorButton
              variant="red"
              className="calc-btn-top"
              onClick={() => handleInput('clear')}
            >
              C
            </CalculatorButton>
          </div>
          <div className="calculator-main-keys">
            <div className="calculator-memory-keys">
              <div className="calc-memory-indicator">{hasMemory ? 'M' : ''}</div>
              <CalculatorButton
                variant="red"
                className="calc-btn-memory"
                onClick={() => handleInput('mc')}
              >
                MC
              </CalculatorButton>
              <CalculatorButton
                variant="red"
                className="calc-btn-memory"
                onClick={() => handleInput('mr')}
              >
                MR
              </CalculatorButton>
              <CalculatorButton
                variant="red"
                className="calc-btn-memory"
                onClick={() => handleInput('ms')}
              >
                MS
              </CalculatorButton>
              <CalculatorButton
                variant="red"
                className="calc-btn-memory"
                onClick={() => handleInput('m-plus')}
              >
                M+
              </CalculatorButton>
            </div>
            <div className="calculator-num-keys">
              <div className="calculator-row">
                <CalculatorButton variant="blue" onClick={() => handleInput('num', '7')}>
                  7
                </CalculatorButton>
                <CalculatorButton variant="blue" onClick={() => handleInput('num', '8')}>
                  8
                </CalculatorButton>
                <CalculatorButton variant="blue" onClick={() => handleInput('num', '9')}>
                  9
                </CalculatorButton>
                <CalculatorButton variant="red" onClick={() => handleInput('divide')}>
                  /
                </CalculatorButton>
                <CalculatorButton variant="blue" onClick={() => handleInput('sqrt')}>
                  sqrt
                </CalculatorButton>
              </div>
              <div className="calculator-row">
                <CalculatorButton variant="blue" onClick={() => handleInput('num', '4')}>
                  4
                </CalculatorButton>
                <CalculatorButton variant="blue" onClick={() => handleInput('num', '5')}>
                  5
                </CalculatorButton>
                <CalculatorButton variant="blue" onClick={() => handleInput('num', '6')}>
                  6
                </CalculatorButton>
                <CalculatorButton variant="red" onClick={() => handleInput('multiply')}>
                  *
                </CalculatorButton>
                <CalculatorButton variant="blue" onClick={() => handleInput('percent')}>
                  %
                </CalculatorButton>
              </div>
              <div className="calculator-row">
                <CalculatorButton variant="blue" onClick={() => handleInput('num', '1')}>
                  1
                </CalculatorButton>
                <CalculatorButton variant="blue" onClick={() => handleInput('num', '2')}>
                  2
                </CalculatorButton>
                <CalculatorButton variant="blue" onClick={() => handleInput('num', '3')}>
                  3
                </CalculatorButton>
                <CalculatorButton variant="red" onClick={() => handleInput('subtract')}>
                  -
                </CalculatorButton>
                <CalculatorButton variant="blue" onClick={() => handleInput('reciprocal')}>
                  1/x
                </CalculatorButton>
              </div>
              <div className="calculator-row">
                <CalculatorButton variant="blue" onClick={() => handleInput('num', '0')}>
                  0
                </CalculatorButton>
                <CalculatorButton variant="blue" onClick={() => handleInput('sign')}>
                  +/-
                </CalculatorButton>
                <CalculatorButton variant="blue" onClick={() => handleInput('decimal')}>
                  .
                </CalculatorButton>
                <CalculatorButton variant="red" onClick={() => handleInput('add')}>
                  +
                </CalculatorButton>
                <CalculatorButton variant="red" onClick={() => handleInput('equals')}>
                  =
                </CalculatorButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
