import { formatDay, formatMinutes, percent, shiftDay } from './format';

describe('formatMinutes', () => {
  it.each([
    [0, '0m'],
    [45, '45m'],
    [60, '1h'],
    [95, '1h 35m'],
    [125.4, '2h 5m'],
    [-5, '0m'],
  ])('%s -> %s', (input, out) => expect(formatMinutes(input)).toBe(out));
});

describe('days', () => {
  it('formats a calendar day without timezone drift', () => {
    expect(formatDay('2026-11-06')).toMatch(/Fri.*6.*Nov/);
  });
  it('shifts across month ends', () => {
    expect(shiftDay('2026-11-30', 1)).toBe('2026-12-01');
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('formats ratios as whole percents', () => {
    expect(percent(0.666)).toBe('67%');
    expect(percent(1)).toBe('100%');
  });
});
