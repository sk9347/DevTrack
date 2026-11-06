import { addDays, dateRange, startOfWeek, toLocalDate } from './dates';

describe('dates', () => {
  it('buckets a UTC instant into the user timezone day', () => {
    // 21:00 UTC on Jan 1 is 02:30 on Jan 2 in Asia/Kolkata (+05:30)
    const d = new Date('2026-01-01T21:00:00Z');
    expect(toLocalDate(d, 'Asia/Kolkata')).toBe('2026-01-02');
    expect(toLocalDate(d, 'UTC')).toBe('2026-01-01');
  });

  it('adds days across month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('builds an inclusive date range', () => {
    expect(dateRange('2026-02-27', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
  });

  it('finds the Monday of a week', () => {
    expect(startOfWeek('2026-11-06')).toBe('2026-11-02'); // Friday -> Monday
    expect(startOfWeek('2026-11-02')).toBe('2026-11-02');
    expect(startOfWeek('2026-11-08')).toBe('2026-11-02'); // Sunday -> Monday
  });
});
