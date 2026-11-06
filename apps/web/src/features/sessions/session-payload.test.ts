import { buildSessionPayload, nowLocalInput, validateSession } from './session-payload';

describe('buildSessionPayload', () => {
  it('derives startedAt from finish time minus the real duration', () => {
    const p = buildSessionPayload({ habitId: 'h', minutes: 55, endedAtLocal: '2026-11-06T21:55' });
    expect(new Date(p.startedAt).getTime()).toBe(new Date('2026-11-06T21:55').getTime() - 55 * 60_000);
    expect(p).toMatchObject({ habitId: 'h', durationMinutes: 55 });
    expect(p).not.toHaveProperty('taskId');
  });

  it('includes the task only when one is chosen', () => {
    expect(buildSessionPayload({ habitId: 'h', minutes: 10, endedAtLocal: '2026-11-06T10:00', taskId: 't' }).taskId).toBe('t');
  });
});

describe('validateSession', () => {
  const ok = { habitId: 'h', minutes: 30, endedAtLocal: '2020-01-01T10:00' };
  it('accepts a valid session', () => expect(validateSession(ok)).toBeNull());
  it('requires a habit', () => expect(validateSession({ ...ok, habitId: '' })).toMatch(/habit/i));
  it.each([0, -3, 1.5, NaN])('rejects %s minutes', (minutes) => expect(validateSession({ ...ok, minutes })).toMatch(/minutes/i));
  it('caps one session at 12 hours', () => expect(validateSession({ ...ok, minutes: 721 })).toMatch(/12 hours/));
  it('rejects a finish time in the future', () => {
    expect(validateSession({ ...ok, endedAtLocal: nowLocalInput(new Date(Date.now() + 3_600_000)) })).toMatch(/future/);
  });
});

describe('nowLocalInput', () => {
  it('formats a datetime-local value', () => {
    expect(nowLocalInput(new Date(2026, 10, 6, 9, 5))).toBe('2026-11-06T09:05');
  });
});
