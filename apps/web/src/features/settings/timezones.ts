/** Fallback when the browser cannot list zones (older engines). Enough to cover common cases; the current zone is always added. */
const FALLBACK = [
  'UTC',
  'America/Los_Angeles',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Africa/Lagos',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

/** Every zone the browser knows, always including `current` (which may be a legacy alias the list omits). */
export function timezoneOptions(current: string): string[] {
  let zones: string[] = FALLBACK;
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone');
    if (list && list.length > 0) zones = list.includes('UTC') ? list : ['UTC', ...list];
  } catch {
    // keep the fallback
  }
  return zones.includes(current) ? zones : [current, ...zones];
}

export function deviceTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

const canonical = (tz: string) => {
  try {
    return new Intl.DateTimeFormat('en', { timeZone: tz }).resolvedOptions().timeZone;
  } catch {
    return tz;
  }
};

/** Asia/Kolkata and Asia/Calcutta are one zone under two names; don't offer to "switch" between them. */
export const sameZone = (a: string, b: string) => a === b || canonical(a) === canonical(b);
