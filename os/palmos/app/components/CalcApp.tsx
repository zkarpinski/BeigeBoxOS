'use client';

import React, { useState } from 'react';

export function CalcApp() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const handleDigit = (digit: string) => {
    if (waitingForNewValue) {
      setDisplay(digit);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleOperator = (op: string) => {
    if (operator && !waitingForNewValue) {
      handleEqual();
    } else {
      setPreviousValue(display);
      setOperator(op);
      setWaitingForNewValue(true);
    }
  };

  const handleEqual = () => {
    if (!operator || !previousValue) return;
    const a = parseFloat(previousValue);
    const b = parseFloat(display);
    let result = 0;
    if (operator === '+') result = a + b;
    if (operator === '-') result = a - b;
    if (operator === '*') result = a * b;
    if (operator === '/') result = a / b;

    if (!isFinite(result)) {
      setDisplay('Error');
    } else {
      setDisplay(String(result).slice(0, 12));
    }
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const handleClearEntry = () => {
    setDisplay('0');
    setWaitingForNewValue(false);
  };

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-white font-sans text-black p-2">
      {/* Display */}
      <div className="flex items-center justify-end border-2 border-black rounded p-2 h-16 mb-2 text-xl font-bold bg-[#f0f0f0] overflow-hidden">
        {display}
      </div>

      {/* Keypad */}
      <div className="flex-1 grid grid-cols-4 gap-2 pb-1">
        <CalcButton label="CE" onClick={handleClearEntry} />
        <CalcButton label="C" onClick={handleClear} />
        <CalcButton label="=" onClick={handleEqual} className="col-span-2" />

        <CalcButton label="7" onClick={() => handleDigit('7')} />
        <CalcButton label="8" onClick={() => handleDigit('8')} />
        <CalcButton label="9" onClick={() => handleDigit('9')} />
        <CalcButton label="/" onClick={() => handleOperator('/')} />

        <CalcButton label="4" onClick={() => handleDigit('4')} />
        <CalcButton label="5" onClick={() => handleDigit('5')} />
        <CalcButton label="6" onClick={() => handleDigit('6')} />
        <CalcButton label="*" onClick={() => handleOperator('*')} />

        <CalcButton label="1" onClick={() => handleDigit('1')} />
        <CalcButton label="2" onClick={() => handleDigit('2')} />
        <CalcButton label="3" onClick={() => handleDigit('3')} />
        <CalcButton label="-" onClick={() => handleOperator('-')} />

        <CalcButton label="0" onClick={() => handleDigit('0')} className="col-span-2" />
        <CalcButton label="." onClick={handleDecimal} />
        <CalcButton label="+" onClick={() => handleOperator('+')} />
      </div>
    </div>
  );
}

function CalcButton({
  label,
  onClick,
  className = '',
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  const isColSpan2 = className.includes('col-span-2');
  return (
    <button
      onClick={onClick}
      style={isColSpan2 ? { gridColumn: 'span 2 / span 2' } : {}}
      className={`border border-black rounded-lg text-lg font-bold bg-white active:bg-black active:text-white flex items-center justify-center`}
    >
      {label}
    </button>
  );
}
