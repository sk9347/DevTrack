import Link from 'next/link';
import { Button, EmptyState } from '@/components/ui/controls';
import { formatMinutes } from '@/lib/format';
import type { DayTrack } from '@/types';

interface Props {
  habits: DayTrack['habits'];
  onLog?: (habitId: string) => void;
  onStart?: (habitId: string) => void;
  /** The habit currently being timed, if any: only one timer runs at a time. */
  timerHabitId?: string | null;
}

export function HabitProgress({ habits, onLog, onStart, timerHabitId }: Props) {
  if (habits.length === 0) {
    return (
      <EmptyState title="No habits yet">
        <Link href="/habits" className="text-accent underline underline-offset-4">
          Add your first habit
        </Link>{' '}
        to start logging study time.
      </EmptyState>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {habits.map((h) => {
        const ratio = Math.min(1, h.minutes / h.dailyTargetMinutes);
        return (
          <li key={h.id} className="flex min-h-16 items-center gap-2 py-3 first:pt-0 last:pb-0 sm:gap-4">
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: h.color }} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="font-medium sm:truncate">{h.name}</p>
                <p className="num shrink-0 text-sm text-muted">
                  {formatMinutes(h.minutes)} / {formatMinutes(h.dailyTargetMinutes)}
                  {h.met && <span className="ml-2 inline-flex rounded-full bg-success-soft px-2 py-0.5 font-sans text-xs font-medium text-success">Met</span>}
                </p>
              </div>
              <div
                role="progressbar"
                aria-label={`${h.name} progress today`}
                aria-valuemin={0}
                aria-valuemax={h.dailyTargetMinutes}
                aria-valuenow={Math.min(h.minutes, h.dailyTargetMinutes)}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-tertiary"
              >
                <div className="h-full rounded-full transition-[width] duration-300 ease-out" style={{ width: `${ratio * 100}%`, backgroundColor: h.color }} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {onStart &&
                (timerHabitId === h.id ? (
                  <span className="px-0.5 text-sm font-medium text-accent">Running</span>
                ) : (
                  <Button
                    variant="ghost"
                    className="px-1.5 sm:px-4"
                    onClick={() => onStart(h.id)}
                    disabled={!!timerHabitId}
                    title={timerHabitId ? 'Finish the running timer first' : undefined}
                    aria-label={`Start timer for ${h.name}`}
                  >
                    Start
                  </Button>
                ))}
              {onLog && (
                <Button variant="secondary" className="px-3 sm:px-4" onClick={() => onLog(h.id)} aria-label={`Log time for ${h.name}`}>
                  <span className="sm:hidden">Log</span>
                  <span className="hidden sm:inline">Log time</span>
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
