import { addDays, dateRange, toLocalDate } from '../common/dates';

export interface SessionLike {
  startedAt: Date;
  durationMinutes: number;
  habitId: string;
}

export interface HabitLike {
  id: string;
  name: string;
  color: string;
  targetFrequency: number;
  dailyTargetMinutes: number;
}

export interface DailyPoint {
  date: string;
  minutes: number;
  sessions: number;
}

/** One entry per calendar day in [from, to], zero-filled. Bucketed in the user's timezone. */
export function buildDaily(
  sessions: Pick<SessionLike, 'startedAt' | 'durationMinutes'>[],
  timeZone: string,
  from: string,
  to: string,
): DailyPoint[] {
  const map = new Map<string, DailyPoint>(
    dateRange(from, to).map((date) => [date, { date, minutes: 0, sessions: 0 }]),
  );
  for (const s of sessions) {
    const point = map.get(toLocalDate(s.startedAt, timeZone));
    if (point) {
      point.minutes += s.durationMinutes;
      point.sessions += 1;
    }
  }
  return [...map.values()];
}

/**
 * Current streak = consecutive active days ending today. Today having no activity yet does not
 * break the streak (the day isn't over), but a fully missed yesterday does. History is never erased:
 * `longest` always reflects the best run ever recorded.
 */
export function calcStreaks(activeDates: string[], today: string): { current: number; longest: number } {
  const days = [...new Set(activeDates)].sort();
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === addDays(days[i - 1], 1) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

/** 0 = no study, 1-4 = increasing intensity for the contribution calendar. */
export function heatLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

/**
 * `targetDays` is the habit's goal for the whole period. `paceDays` is the share of it that is due so far
 * (days elapsed up to `today`), so a mid-week check reads against where you should be, not the finished week.
 * `completion` uses the pace, floored at one day so day one isn't judged against a zero target.
 * With `today` omitted (or at/after `to`) the period is treated as over and pace equals the full target.
 */
export function habitSummary(
  habit: HabitLike,
  sessions: SessionLike[],
  timeZone: string,
  from: string,
  to: string,
  today: string = to,
) {
  const mine = sessions.filter((s) => s.habitId === habit.id);
  const daily = buildDaily(mine, timeZone, from, to);
  const days = daily.length;
  const targetDays = Math.max(1, Math.round((habit.targetFrequency * days) / 7));
  const daysMet = daily.filter((d) => d.minutes >= habit.dailyTargetMinutes).length;
  const elapsed = Math.min(days, Math.max(1, daily.filter((d) => d.date <= today).length));
  const paceDays = Math.min(targetDays, Math.max(1, Math.round((habit.targetFrequency * elapsed) / 7)));
  return {
    habitId: habit.id,
    name: habit.name,
    color: habit.color,
    minutes: daily.reduce((sum, d) => sum + d.minutes, 0),
    daysMet,
    targetDays,
    paceDays,
    completion: Math.min(1, daysMet / paceDays),
  };
}
