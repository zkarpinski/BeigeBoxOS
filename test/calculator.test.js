/**
 * Unit tests for Calculator98 (Windows 98 Calculator logic).
 */
describe('Calculator98', () => {
  beforeAll(() => {
    if (!document.getElementById('calc-display')) {
      const wrap = document.createElement('div');
      wrap.className = 'calculator-keypad';
      const display = document.createElement('input');
      display.id = 'calc-display';
      display.type = 'text';
      display.value = '0';
      const memory = document.createElement('div');
      memory.id = 'calc-memory-indicator';
      memory.className = 'calc-memory-indicator';
      document.body.appendChild(display);
      document.body.appendChild(memory);
      document.body.appendChild(wrap);
    }
    require('../apps/calculator/calculator.js');
  });

  beforeEach(() => {
    window.Calculator98.clearAll();
  });

  test('Calculator98 is defined', () => {
    expect(window.Calculator98).toBeDefined();
    expect(typeof window.Calculator98.handleInput).toBe('function');
    expect(typeof window.Calculator98.clearAll).toBe('function');
  });

  test('displayValue starts at 0', () => {
    expect(window.Calculator98.displayValue).toBe('0');
  });

  test('inputDigit appends digits', () => {
    window.Calculator98.handleInput('num', '1');
    expect(window.Calculator98.displayValue).toBe('1');
    window.Calculator98.handleInput('num', '2');
    expect(window.Calculator98.displayValue).toBe('12');
  });

  test('inputDigit replaces 0 when first digit', () => {
    window.Calculator98.handleInput('num', '5');
    expect(window.Calculator98.displayValue).toBe('5');
  });

  test('decimal adds decimal point', () => {
    window.Calculator98.handleInput('num', '3');
    window.Calculator98.handleInput('decimal');
    expect(window.Calculator98.displayValue).toBe('3.');
  });

  test('decimal does not add second decimal', () => {
    window.Calculator98.handleInput('num', '1');
    window.Calculator98.handleInput('decimal');
    window.Calculator98.handleInput('num', '5');
    window.Calculator98.handleInput('decimal');
    expect(window.Calculator98.displayValue).toBe('1.5');
  });

  test('add then equals performs calculation', () => {
    window.Calculator98.handleInput('num', '1');
    window.Calculator98.handleInput('num', '0');
    window.Calculator98.handleInput('add');
    window.Calculator98.handleInput('num', '5');
    window.Calculator98.handleInput('equals');
    expect(window.Calculator98.displayValue).toBe('15');
  });

  test('subtract performs calculation', () => {
    window.Calculator98.handleInput('num', '2');
    window.Calculator98.handleInput('num', '0');
    window.Calculator98.handleInput('subtract');
    window.Calculator98.handleInput('num', '7');
    window.Calculator98.handleInput('equals');
    expect(window.Calculator98.displayValue).toBe('13');
  });

  test('multiply performs calculation', () => {
    window.Calculator98.handleInput('num', '6');
    window.Calculator98.handleInput('multiply');
    window.Calculator98.handleInput('num', '7');
    window.Calculator98.handleInput('equals');
    expect(window.Calculator98.displayValue).toBe('42');
  });

  test('divide performs calculation', () => {
    window.Calculator98.handleInput('num', '2');
    window.Calculator98.handleInput('num', '0');
    window.Calculator98.handleInput('divide');
    window.Calculator98.handleInput('num', '4');
    window.Calculator98.handleInput('equals');
    expect(window.Calculator98.displayValue).toBe('5');
  });

  test('divide by zero sets error', () => {
    window.Calculator98.handleInput('num', '5');
    window.Calculator98.handleInput('divide');
    window.Calculator98.handleInput('num', '0');
    window.Calculator98.handleInput('equals');
    expect(window.Calculator98.error).toBe(true);
  });

  test('clear resets error and display', () => {
    window.Calculator98.handleInput('num', '5');
    window.Calculator98.handleInput('divide');
    window.Calculator98.handleInput('num', '0');
    window.Calculator98.handleInput('equals');
    expect(window.Calculator98.error).toBe(true);
    window.Calculator98.handleInput('clear');
    expect(window.Calculator98.error).toBe(false);
    expect(window.Calculator98.displayValue).toBe('0');
  });

  test('clearEntry resets display only', () => {
    window.Calculator98.handleInput('num', '9');
    window.Calculator98.handleInput('clear-entry');
    expect(window.Calculator98.displayValue).toBe('0');
  });

  test('handleSqrt computes square root', () => {
    window.Calculator98.handleInput('num', '9');
    window.Calculator98.handleInput('sqrt');
    expect(window.Calculator98.displayValue).toBe('3');
  });

  test('handleSqrt of negative sets error', () => {
    window.Calculator98.handleInput('num', '9');
    window.Calculator98.handleInput('sign');
    window.Calculator98.handleInput('sqrt');
    expect(window.Calculator98.error).toBe(true);
  });

  test('handleSign toggles minus', () => {
    window.Calculator98.handleInput('num', '5');
    window.Calculator98.handleInput('sign');
    expect(window.Calculator98.displayValue).toBe('-5');
    window.Calculator98.handleInput('sign');
    expect(window.Calculator98.displayValue).toBe('5');
  });

  test('handleReciprocal computes 1/x', () => {
    window.Calculator98.handleInput('num', '4');
    window.Calculator98.handleInput('reciprocal');
    expect(parseFloat(window.Calculator98.displayValue)).toBeCloseTo(0.25);
  });

  test('handleReciprocal of zero sets error', () => {
    window.Calculator98.handleInput('num', '0');
    window.Calculator98.handleInput('reciprocal');
    expect(window.Calculator98.error).toBe(true);
  });

  test('handleBackspace removes last digit', () => {
    window.Calculator98.handleInput('num', '1');
    window.Calculator98.handleInput('num', '2');
    window.Calculator98.handleInput('num', '3');
    window.Calculator98.handleInput('backspace');
    expect(window.Calculator98.displayValue).toBe('12');
    window.Calculator98.handleInput('backspace');
    window.Calculator98.handleInput('backspace');
    expect(window.Calculator98.displayValue).toBe('0');
  });

  test('memoryStore and memoryRecall', () => {
    window.Calculator98.handleInput('num', '4');
    window.Calculator98.handleInput('num', '2');
    window.Calculator98.handleInput('ms');
    expect(window.Calculator98.hasMemory).toBe(true);
    expect(window.Calculator98.memory).toBe(42);
    window.Calculator98.handleInput('clear');
    window.Calculator98.handleInput('mr');
    expect(window.Calculator98.displayValue).toBe('42');
  });

  test('memoryClear clears memory', () => {
    window.Calculator98.handleInput('num', '1');
    window.Calculator98.handleInput('num', '0');
    window.Calculator98.handleInput('ms');
    window.Calculator98.handleInput('mc');
    expect(window.Calculator98.hasMemory).toBe(false);
    expect(window.Calculator98.memory).toBe(0);
  });

  test('memoryAdd adds to memory', () => {
    window.Calculator98.handleInput('num', '1');
    window.Calculator98.handleInput('num', '0');
    window.Calculator98.handleInput('m-plus');
    window.Calculator98.handleInput('num', '2');
    window.Calculator98.handleInput('num', '0');
    window.Calculator98.handleInput('m-plus');
    expect(window.Calculator98.memory).toBe(30);
  });

  test('handlePercent uses previous value', () => {
    window.Calculator98.handleInput('num', '2');
    window.Calculator98.handleInput('num', '0');
    window.Calculator98.handleInput('multiply');
    window.Calculator98.handleInput('num', '2');
    window.Calculator98.handleInput('num', '5');
    window.Calculator98.handleInput('percent');
    expect(parseFloat(window.Calculator98.displayValue)).toBe(5);
  });

  test('operator change when waiting updates operator', () => {
    window.Calculator98.handleInput('num', '5');
    window.Calculator98.handleInput('add');
    window.Calculator98.handleInput('subtract');
    window.Calculator98.handleInput('num', '3');
    window.Calculator98.handleInput('equals');
    expect(window.Calculator98.displayValue).toBe('2');
  });
});
