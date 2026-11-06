'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { parseTimer, timerKey, type ActiveTimer } from './timer-core';

interface TimerApi {
  timer: ActiveTimer | null;
  /** Begins timing a habit. Returns false (and changes nothing) if a timer is already running. */
  start: (habit: { id: string; name: string }) => boolean;
  /** Forgets the timer. Call only after the session was saved, or the user chose to discard it. */
  clear: () => void;
}

const TimerContext = createContext<TimerApi>({ timer: null, start: () => false, clear: () => {} });
export const useTimer = () => useContext(TimerContext);

function read(key: string): ActiveTimer | null {
  try {
    return parseTimer(window.localStorage.getItem(key));
  } catch (e) {
    console.error('Timer: cannot read saved timer', e);
    return null;
  }
}

/**
 * One timer per signed-in user, kept in localStorage (namespaced by user id) so it survives refreshes and is
 * shared by tabs. Nothing is sent to the server until the user confirms the session in the Log dialog.
 */
export function TimerProvider({ userId, children }: { userId?: string; children: ReactNode }) {
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const key = userId ? timerKey(userId) : null;

  useEffect(() => {
    if (!key) {
      setTimer(null);
      return;
    }
    setTimer(read(key));
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) setTimer(read(key));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  const start = useCallback(
    (habit: { id: string; name: string }) => {
      if (!key || read(key)) return false; // re-read: another tab may have started one
      const next: ActiveTimer = { habitId: habit.id, habitName: habit.name, startedAt: new Date().toISOString() };
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.error('Timer: cannot persist timer; it will not survive a refresh', e);
      }
      setTimer(next);
      return true;
    },
    [key],
  );

  const clear = useCallback(() => {
    if (key) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.error('Timer: cannot clear saved timer', e);
      }
    }
    setTimer(null);
  }, [key]);

  const value = useMemo(() => ({ timer, start, clear }), [timer, start, clear]);
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
