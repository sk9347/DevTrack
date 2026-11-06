'use client';

import { useState } from 'react';
import { Button, EmptyState, ErrorText } from '@/components/ui/controls';
import { api, notifyMutated } from '@/lib/api-client';
import { formatDayLong, formatMinutes, formatTime } from '@/lib/format';
import type { DayTrack } from '@/types';

/** The daily track for one date: what was studied, when, and what was planned. */
export function DayDetail({ track, timeZone }: { track: DayTrack; timeZone?: string }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A mistyped duration must be correctable, or "real durations" becomes "real durations plus typos".
  async function remove(id: string) {
    try {
      await api(`/sessions/${id}`, { method: 'DELETE' });
      setConfirming(null);
      setError(null);
      notifyMutated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the session');
    }
  }

  return (
    <section aria-label={`Details for ${formatDayLong(track.date)}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">{formatDayLong(track.date)}</h2>
        <p className="tabular-nums text-muted">{formatMinutes(track.totalMinutes)} studied</p>
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">Sessions</h3>
      {track.sessions.length === 0 ? (
        <EmptyState title="No study logged this day">Past days stay as they are. Earlier work is never erased.</EmptyState>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {track.sessions.map((s) => (
            <li key={s.id} className="flex min-h-12 items-center gap-3 py-2">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.habitColor }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  {s.habitName}
                  {s.taskTitle && <span className="text-muted"> · {s.taskTitle}</span>}
                </p>
                <p className="num text-sm text-muted">
                  {formatTime(s.startedAt, timeZone)}–{formatTime(s.endedAt, timeZone)}
                </p>
              </div>
              <p className="num">{formatMinutes(s.durationMinutes)}</p>
              {confirming === s.id ? (
                <div className="flex gap-1">
                  <Button variant="danger" onClick={() => remove(s.id)}>
                    Confirm delete
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirming(null)}>
                    Keep
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" onClick={() => setConfirming(s.id)} aria-label={`Delete ${s.habitName} session, ${formatMinutes(s.durationMinutes)}`}>
                  Delete
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ErrorText>{error}</ErrorText>

      {track.tasks.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">Tasks</h3>
          <ul className="divide-y divide-line border-y border-line">
            {track.tasks.map((t) => (
              <li key={t.id} className="flex min-h-11 items-center justify-between gap-3 py-2">
                <span className={t.status === 'DONE' ? 'text-muted line-through' : ''}>{t.title}</span>
                <span className="text-sm text-muted">{t.status === 'DONE' ? 'Done' : 'Not done'}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
