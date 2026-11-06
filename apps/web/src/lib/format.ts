/** 95 -> "1h 35m", 60 -> "1h", 45 -> "45m", 0 -> "0m" */
export function formatMinutes(total: number): string {
  const m = Math.max(0, Math.round(total));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest}m`;
  return rest === 0 ? `${h}h` : `${h}h ${rest}m`;
}

const parts = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

/** "2026-11-06" -> "Fri 6 Nov" (calendar days have no timezone, so format in UTC). */
export function formatDay(ymd: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parts(ymd));
}

export function formatDayLong(ymd: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parts(ymd));
}

export function shiftDay(ymd: string, n: number): string {
  const d = parts(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatTime(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(new Date(iso));
}

export const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;
