/**
 * Pure timer logic. Elapsed time is always `now - startedAt`, never a count of ticks, so a sleeping laptop,
 * a refresh or a throttled background tab cannot make the clock drift.
 */

export interface ActiveTimer {
  habitId: string;
  habitName: string;
  startedAt: string; // ISO instant
}

/** The API rejects sessions longer than this. */
export const MAX_MINUTES = 720;

export const timerKey = (userId: string) => `devtrack:timer:${userId}`;

export function elapsedMs(startedAt: string, now: number): number {
  const start = Date.parse(startedAt);
  return Number.isNaN(start) ? 0 : Math.max(0, now - start); // a clock moved backwards never shows negative time
}

export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** Whole minutes to log: rounded up, at least 1, at most the API cap. `capped` says the real time was longer. */
export function minutesFor(ms: number): { minutes: number; capped: boolean } {
  const raw = Math.max(1, Math.ceil(ms / 60_000));
  return { minutes: Math.min(MAX_MINUTES, raw), capped: raw > MAX_MINUTES };
}

export function parseTimer(raw: string | null): ActiveTimer | null {
  if (!raw) return null;
  try {
    const t = JSON.parse(raw) as Partial<ActiveTimer>;
    if (typeof t.habitId === 'string' && typeof t.habitName === 'string' && typeof t.startedAt === 'string' && !Number.isNaN(Date.parse(t.startedAt))) {
      return { habitId: t.habitId, habitName: t.habitName, startedAt: t.startedAt };
    }
  } catch {
    // fall through: a corrupt record is treated as no timer
  }
  return null;
}
