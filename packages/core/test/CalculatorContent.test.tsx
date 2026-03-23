/**
 * Unit and functional tests for CalculatorContent (packages/core).
 * These tests cover the pure calculator logic and UI, without any win98 shell dependencies.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalculatorContent } from '../apps/calculator/CalculatorContent';

function renderCalculator() {
  return render(<CalculatorContent />);
}

function getDisplay(): HTMLInputElement {
  return screen.getByLabelText('Display') as HTMLInputElement;
}

function getDisplayValue(): string {
  return getDisplay().value;
}

function getCalculatorBody(): HTMLElement {
  return screen.getByRole('application', { name: 'Calculator' }) as HTMLElement;
}

async function press(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole('button', { name: label }));
}

describe('CalculatorContent', () => {
  test('renders without crashing', () => {
    renderCalculator();
    expect(getDisplay()).toBeInTheDocument();
  });

  test('display shows 0 initially', () => {
    renderCalculator();
    expect(getDisplayValue()).toBe('0');
  });

  test('has Edit, View, Help menu items', () => {
    const { container } = renderCalculator();
    const menuItems = container.querySelectorAll('.calculator-menu-item');
    expect(menuItems).toHaveLength(3);
    expect(container.textContent).toMatch(/edit/i);
    expect(container.textContent).toMatch(/view/i);
    expect(container.textContent).toMatch(/help/i);
  });

  test('number buttons update display', async () => {
    const user = userEvent.setup();
    renderCalculator();
    await press(user, '7');
    expect(getDisplayValue()).toBe('7');
    await press(user, '2');
    expect(getDisplayValue()).toBe('72');
  });

  test('decimal button adds decimal point', async () => {
    const user = userEvent.setup();
    renderCalculator();
    await press(user, '5');
    await press(user, '.');
    expect(getDisplayValue()).toBe('5.');
    await press(user, '2');
    expect(getDisplayValue()).toBe('5.2');
  });

  test('C (clear) resets display to 0', async () => {
    const user = userEvent.setup();
    renderCalculator();
    await press(user, '9');
    await press(user, 'C');
    expect(getDisplayValue()).toBe('0');
  });

  test('CE clears current entry', async () => {
    const user = userEvent.setup();
    renderCalculator();
    await press(user, '1');
    await press(user, '2');
    await press(user, 'CE');
    expect(getDisplayValue()).toBe('0');
  });

  describe('add', () => {
    test('2 + 3 = 5', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '2');
      await press(user, '+');
      await press(user, '3');
      await press(user, '=');
      expect(getDisplayValue()).toBe('5');
    });

    test('10 + 0.5 = 10.5', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '1');
      await press(user, '0');
      await press(user, '+');
      await press(user, '0');
      await press(user, '.');
      await press(user, '5');
      await press(user, '=');
      expect(getDisplayValue()).toBe('10.5');
    });
  });

  describe('subtract', () => {
    test('10 - 4 = 6', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '1');
      await press(user, '0');
      await press(user, '-');
      await press(user, '4');
      await press(user, '=');
      expect(getDisplayValue()).toBe('6');
    });

    test('3 - 8 = -5', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '3');
      await press(user, '-');
      await press(user, '8');
      await press(user, '=');
      expect(getDisplayValue()).toBe('-5');
    });
  });

  describe('multiply', () => {
    test('6 * 7 = 42', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '6');
      await press(user, '*');
      await press(user, '7');
      await press(user, '=');
      expect(getDisplayValue()).toBe('42');
    });

    test('0 * 99 = 0', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '0');
      await press(user, '*');
      await press(user, '9');
      await press(user, '9');
      await press(user, '=');
      expect(getDisplayValue()).toBe('0');
    });
  });

  describe('divide', () => {
    test('20 / 4 = 5', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '2');
      await press(user, '0');
      await press(user, '/');
      await press(user, '4');
      await press(user, '=');
      expect(getDisplayValue()).toBe('5');
    });

    test('15 / 2 = 7.5', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '1');
      await press(user, '5');
      await press(user, '/');
      await press(user, '2');
      await press(user, '=');
      expect(getDisplayValue()).toBe('7.5');
    });

    test('divide by zero shows Error', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '5');
      await press(user, '/');
      await press(user, '0');
      await press(user, '=');
      expect(getDisplayValue()).toBe('Error');
    });
  });

  describe('chained operations', () => {
    test('2 + 3 + 4 = 9', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '2');
      await press(user, '+');
      await press(user, '3');
      await press(user, '+');
      expect(getDisplayValue()).toBe('5');
      await press(user, '4');
      await press(user, '=');
      expect(getDisplayValue()).toBe('9');
    });
  });

  describe('sqrt', () => {
    test('sqrt 9 = 3', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '9');
      await press(user, 'sqrt');
      expect(getDisplayValue()).toBe('3');
    });
  });

  describe('sign (+/-)', () => {
    test('toggles sign', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '5');
      await press(user, '+/-');
      expect(getDisplayValue()).toBe('-5');
      await press(user, '+/-');
      expect(getDisplayValue()).toBe('5');
    });
  });

  describe('Backspace', () => {
    test('removes last digit', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await press(user, '1');
      await press(user, '2');
      await press(user, '3');
      await press(user, 'Backspace');
      expect(getDisplayValue()).toBe('12');
      await press(user, 'Backspace');
      expect(getDisplayValue()).toBe('1');
      await press(user, 'Backspace');
      expect(getDisplayValue()).toBe('0');
    });
  });

  describe('keyboard input', () => {
    test('calculator body is focusable', () => {
      renderCalculator();
      const body = getCalculatorBody();
      expect(body).toHaveAttribute('tabindex', '0');
    });

    test('number key updates display when body has focus', async () => {
      const user = userEvent.setup();
      renderCalculator();
      const body = getCalculatorBody();
      body.focus();
      await user.keyboard('9');
      expect(getDisplayValue()).toBe('9');
    });

    test('2+2=4 via keyboard when body has focus', async () => {
      const user = userEvent.setup();
      renderCalculator();
      getCalculatorBody().focus();
      await user.keyboard('2');
      await user.keyboard('+');
      await user.keyboard('2');
      await user.keyboard('=');
      expect(getDisplayValue()).toBe('4');
    });

    test('Enter triggers equals', async () => {
      const user = userEvent.setup();
      renderCalculator();
      getCalculatorBody().focus();
      await user.keyboard('3');
      await user.keyboard('+');
      await user.keyboard('5');
      await user.keyboard('{Enter}');
      expect(getDisplayValue()).toBe('8');
    });

    test('Escape clears display', async () => {
      const user = userEvent.setup();
      renderCalculator();
      getCalculatorBody().focus();
      await user.keyboard('7');
      expect(getDisplayValue()).toBe('7');
      await user.keyboard('{Escape}');
      expect(getDisplayValue()).toBe('0');
    });
  });
});
