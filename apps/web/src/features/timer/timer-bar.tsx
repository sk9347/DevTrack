'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/controls';
import { LogSessionDialog } from '@/features/sessions/log-session-dialog';
import { useTimer } from './timer-context';
import { elapsedMs, formatClock, MAX_MINUTES, minutesFor } from './timer-core';

/**
 * The running timer, pinned under the header on every page. The clock is derived from the stored start time
 * on each render, so a throttled or sleeping tab catches up the moment it is looked at.
 */
export function TimerBar() {
  const { timer, clear } = useTimer();
  const [now, setNow] = useState(() => Date.now());
  const [finishing, setFinishing] = useState<{ minutes: number; capped: boolean } | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  useEffect(() => {
    if (!timer) return;
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const onVisible = () => setNow(Date.now());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [timer]);

  const habits = useMemo(() => (timer ? [{ id: timer.habitId, name: timer.habitName }] : []), [timer]);
  if (!timer) return null;

  const ms = elapsedMs(timer.startedAt, now);
  return (
    <div className="sticky top-16 z-20 flex min-h-16 flex-wrap items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <span className="size-2.5 shrink-0 rounded-full bg-accent" aria-hidden />
      <span role="status" className="sr-only">
        Timer running for {timer.habitName}
      </span>
      <p className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium">{timer.habitName}</span>
      </p>
      {/* aria-live off: announcing every second would drown out the page.
          The top-layer marker keeps this global status readable by assistive tech while a dialog is open,
          without exposing the timer's buttons behind the modal. */}
      <span
        role="timer"
        aria-live="off"
        aria-label={`Elapsed time for ${timer.habitName}`}
        className="num text-lg tracking-tight"
        data-react-aria-top-layer="true"
      >
        {formatClock(ms)}
      </span>

      {confirmingDiscard ? (
        <div className="flex gap-1">
          <Button
            variant="danger"
            onClick={() => {
              clear();
              setConfirmingDiscard(false);
            }}
          >
            Confirm discard
          </Button>
          <Button variant="ghost" onClick={() => setConfirmingDiscard(false)}>
            Keep
          </Button>
        </div>
      ) : (
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => setConfirmingDiscard(true)}>
            Discard
          </Button>
          <Button variant="primary" onClick={() => setFinishing(minutesFor(elapsedMs(timer.startedAt, Date.now())))}>
            Stop
          </Button>
        </div>
      )}

      <LogSessionDialog
        open={finishing !== null}
        onClose={() => setFinishing(null)}
        habits={habits}
        defaultHabitId={timer.habitId}
        defaultMinutes={finishing?.minutes}
        notice={finishing?.capped ? `The timer ran past ${MAX_MINUTES / 60} hours, so this is capped. Edit the minutes if needed.` : undefined}
        onSaved={() => {
          // Only now is the time safely on the server; a failed save leaves the timer running.
          clear();
          setFinishing(null);
        }}
      />
    </div>
  );
}
