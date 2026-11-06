import { elapsedMs, formatClock, MAX_MINUTES, minutesFor, parseTimer, timerKey } from './timer-core';

describe('elapsedMs', () => {
  it('is now minus the start, so it survives sleep and refresh', () => {
    const start = '2026-11-06T10:00:00.000Z';
    expect(elapsedMs(start, Date.parse('2026-11-06T10:42:10.000Z'))).toBe((42 * 60 + 10) * 1000);
    // a laptop asleep for 3 hours: the next read simply reflects the real time
    expect(elapsedMs(start, Date.parse('2026-11-06T13:00:00.000Z'))).toBe(3 * 3600 * 1000);
  });
  it('never goes negative if the clock moves backwards, and ignores a corrupt start', () => {
    expect(elapsedMs('2026-11-06T10:00:00.000Z', Date.parse('2026-11-06T09:00:00.000Z'))).toBe(0);
    expect(elapsedMs('not a date', Date.now())).toBe(0);
  });
});

describe('formatClock', () => {
  it('formats hours, minutes and seconds', () => {
    expect(formatClock(0)).toBe('00:00:00');
    expect(formatClock((42 * 60 + 10) * 1000)).toBe('00:42:10');
    expect(formatClock((3 * 3600 + 5) * 1000)).toBe('03:00:05');
  });
});

describe('minutesFor', () => {
  it('rounds up to the next minute with a floor of one', () => {
    expect(minutesFor(0)).toEqual({ minutes: 1, capped: false });
    expect(minutesFor(61_000)).toEqual({ minutes: 2, capped: false });
    expect(minutesFor(25 * 60_000)).toEqual({ minutes: 25, capped: false });
  });
  it('caps at the API limit and says so', () => {
    expect(minutesFor(13 * 3600_000)).toEqual({ minutes: MAX_MINUTES, capped: true });
    expect(minutesFor(12 * 3600_000)).toEqual({ minutes: MAX_MINUTES, capped: false });
  });
});

describe('parseTimer / timerKey', () => {
  it('round-trips a valid timer and rejects anything else', () => {
    const t = { habitId: 'h1', habitName: 'DSA', startedAt: '2026-11-06T10:00:00.000Z' };
    expect(parseTimer(JSON.stringify(t))).toEqual(t);
    expect(parseTimer(null)).toBeNull();
    expect(parseTimer('{oops')).toBeNull();
    expect(parseTimer(JSON.stringify({ habitId: 'h1' }))).toBeNull();
    expect(parseTimer(JSON.stringify({ ...t, startedAt: 'nope' }))).toBeNull();
  });
  it('namespaces the key by user so accounts never share a timer', () => {
    expect(timerKey('a')).not.toBe(timerKey('b'));
  });
});
