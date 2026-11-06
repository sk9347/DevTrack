export interface SessionForm {
  habitId: string;
  minutes: number;
  /** Value of a datetime-local input: "YYYY-MM-DDTHH:mm" in the browser's timezone. */
  endedAtLocal: string;
  taskId?: string;
}

/** The user types when they finished; the API stores when they started plus the real duration. */
export function buildSessionPayload(f: SessionForm) {
  const ended = new Date(f.endedAtLocal);
  return {
    habitId: f.habitId,
    ...(f.taskId ? { taskId: f.taskId } : {}),
    durationMinutes: f.minutes,
    startedAt: new Date(ended.getTime() - f.minutes * 60_000).toISOString(),
  };
}

export function validateSession(f: Pick<SessionForm, 'habitId' | 'minutes' | 'endedAtLocal'>): string | null {
  if (!f.habitId) return 'Choose a habit to log time against';
  if (!Number.isInteger(f.minutes) || f.minutes < 1) return 'Enter the minutes you studied (at least 1)';
  if (f.minutes > 720) return 'A single session is capped at 12 hours';
  const ended = new Date(f.endedAtLocal);
  if (Number.isNaN(ended.getTime())) return 'Enter when you finished';
  if (ended.getTime() > Date.now() + 5 * 60_000) return 'Finish time cannot be in the future';
  return null;
}

/** "YYYY-MM-DDTHH:mm" for now, in the browser timezone (what datetime-local expects). */
export function nowLocalInput(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
