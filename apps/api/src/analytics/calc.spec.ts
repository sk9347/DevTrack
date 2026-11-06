import { buildDaily, calcStreaks, heatLevel, habitSummary } from './calc';

const S = (startedAt: string, minutes: number, habitId = 'h1') => ({
  startedAt: new Date(startedAt),
  durationMinutes: minutes,
  habitId,
});

describe('buildDaily', () => {
  it('sums minutes per local day and fills empty days with zero', () => {
    const daily = buildDaily(
      [S('2026-11-02T10:00:00Z', 30), S('2026-11-02T12:00:00Z', 25), S('2026-11-04T10:00:00Z', 40)],
      'UTC',
      '2026-11-02',
      '2026-11-04',
    );
    expect(daily).toEqual([
      { date: '2026-11-02', minutes: 55, sessions: 2 },
      { date: '2026-11-03', minutes: 0, sessions: 0 },
      { date: '2026-11-04', minutes: 40, sessions: 1 },
    ]);
  });

  it('respects the user timezone when bucketing late-evening sessions', () => {
    // 20:00 UTC = 01:30 next day in Kolkata
    const daily = buildDaily([S('2026-11-02T20:00:00Z', 50)], 'Asia/Kolkata', '2026-11-02', '2026-11-03');
    expect(daily.map((d) => d.minutes)).toEqual([0, 50]);
  });
});

describe('calcStreaks', () => {
  it('counts consecutive active days ending today', () => {
    expect(calcStreaks(['2026-11-04', '2026-11-05', '2026-11-06'], '2026-11-06')).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it('keeps the streak alive when today has no activity yet', () => {
    expect(calcStreaks(['2026-11-04', '2026-11-05'], '2026-11-06').current).toBe(2);
  });

  it('breaks the current streak after a fully missed day but keeps history', () => {
    const r = calcStreaks(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-06'], '2026-11-06');
    expect(r).toEqual({ current: 1, longest: 3 });
  });

  it('is zero with no activity', () => {
    expect(calcStreaks([], '2026-11-06')).toEqual({ current: 0, longest: 0 });
  });

  it('is zero when the last activity was before yesterday', () => {
    expect(calcStreaks(['2026-11-01'], '2026-11-06')).toEqual({ current: 0, longest: 1 });
  });

  it('ignores duplicate dates', () => {
    expect(calcStreaks(['2026-11-06', '2026-11-06'], '2026-11-06').current).toBe(1);
  });
});

describe('heatLevel', () => {
  it.each([
    [0, 0],
    [1, 1],
    [29, 1],
    [30, 2],
    [59, 2],
    [60, 3],
    [119, 3],
    [120, 4],
    [400, 4],
  ])('%i minutes -> level %i', (m, lvl) => expect(heatLevel(m)).toBe(lvl));
});

describe('habitSummary', () => {
  const habit = { id: 'h1', name: 'DSA', color: '#fff', targetFrequency: 3, dailyTargetMinutes: 30 };

  it('counts a day as met only when minutes reach the daily target', () => {
    const sessions = [
      S('2026-11-02T10:00:00Z', 20),
      S('2026-11-02T11:00:00Z', 15), // 35 -> met
      S('2026-11-03T10:00:00Z', 10), // 10 -> not met
      S('2026-11-04T10:00:00Z', 45), // met
    ];
    const r = habitSummary(habit, sessions, 'UTC', '2026-11-02', '2026-11-08');
    expect(r.minutes).toBe(90);
    expect(r.daysMet).toBe(2);
    expect(r.targetDays).toBe(3);
    expect(r.completion).toBeCloseTo(2 / 3);
  });

  it('caps completion at 1 and scales the target for longer periods', () => {
    const sessions = Array.from({ length: 7 }, (_, i) => S(`2026-11-0${i + 1}T10:00:00Z`, 60));
    expect(habitSummary(habit, sessions, 'UTC', '2026-11-01', '2026-11-07').completion).toBe(1);
    expect(habitSummary(habit, [], 'UTC', '2026-10-08', '2026-11-06').targetDays).toBe(13); // round(3 * 30 / 7)
  });

  it('judges a week in progress against the pace so far, not the finished week', () => {
    // 3 days/week target, 30m/day. Mon-Wed elapsed (3 days): pace = round(3*3/7) = 1 day.
    const sessions = [S('2026-11-02T10:00:00Z', 45)];
    const r = habitSummary(habit, sessions, 'UTC', '2026-11-02', '2026-11-08', '2026-11-04');
    expect(r.targetDays).toBe(3);
    expect(r.paceDays).toBe(1);
    expect(r.completion).toBe(1);
    // The same data once the week is over is 1 of 3.
    expect(habitSummary(habit, sessions, 'UTC', '2026-11-02', '2026-11-08', '2026-11-08').completion).toBeCloseTo(1 / 3);
  });

  it('never divides by a zero pace on the first day', () => {
    const r = habitSummary(habit, [], 'UTC', '2026-11-02', '2026-11-08', '2026-11-02');
    expect(r.paceDays).toBe(1);
    expect(r.completion).toBe(0);
  });

  it('ignores sessions that belong to other habits', () => {
    const r = habitSummary(habit, [S('2026-11-02T10:00:00Z', 90, 'other')], 'UTC', '2026-11-02', '2026-11-08');
    expect(r.minutes).toBe(0);
  });
});
