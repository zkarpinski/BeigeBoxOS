'use client';

import React from 'react';

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
