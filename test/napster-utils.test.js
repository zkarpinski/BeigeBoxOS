/**
 * Unit tests for Napster utility functions.
 */
describe('Napster utils', () => {
  let fmtLen;

  beforeAll(() => {
    // Mock window and other globals for the IIFE
    global.window = {};

    // Load the file
    require('../apps/napster/napster.js');

    fmtLen = global.window.Napster97.fmtLen;
  });

  afterAll(() => {
    delete global.window;
  });

  test('fmtLen formats 0 seconds as 0:00', () => {
    expect(fmtLen(0)).toBe('0:00');
  });

  test('fmtLen formats less than 10 seconds with a leading zero', () => {
    expect(fmtLen(5)).toBe('0:05');
  });

  test('fmtLen formats 59 seconds as 0:59', () => {
    expect(fmtLen(59)).toBe('0:59');
  });

  test('fmtLen formats 60 seconds as 1:00', () => {
    expect(fmtLen(60)).toBe('1:00');
  });

  test('fmtLen formats 61 seconds as 1:01', () => {
    expect(fmtLen(61)).toBe('1:01');
  });

  test('fmtLen formats 119 seconds as 1:59', () => {
    expect(fmtLen(119)).toBe('1:59');
  });

  test('fmtLen formats large number of seconds correctly', () => {
    expect(fmtLen(3600)).toBe('60:00'); // 1 hour
    expect(fmtLen(3661)).toBe('61:01');
  });
});
