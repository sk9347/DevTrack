'use client';

import { useState } from 'react';
import { Button, ErrorText, LoadError, SectionHeading } from '@/components/ui/controls';
import { api, notifyMutated } from '@/lib/api-client';
import { formatDay } from '@/lib/format';
import { useFetch } from '@/lib/use-fetch';
import type { Task } from '@/types';

const SHOWN = 10;

/**
 * Unfinished tasks from earlier days. Nothing is moved automatically: the user's due dates are theirs,
 * so each row offers an explicit "Move to today". Completing one leaves its due date, so analytics still
 * counts it on the day it was planned. Hidden entirely when there is nothing overdue.
 */
export function OverduePanel({ today }: { today: string }) {
  const { data, error: loadError, reload } = useFetch<Task[]>(`/tasks?overdueBefore=${today}`);
  const [all, setAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      notifyMutated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  if (loadError && !data) return <LoadError what="overdue tasks" message={loadError} onRetry={() => void reload()} className="mt-8" />;
  if (!data || data.length === 0) return null;

  const rows = all ? data : data.slice(0, SHOWN);
  const hidden = data.length - rows.length;
  return (
    <section className="mt-8" aria-labelledby="overdue">
      <SectionHeading>
        <span id="overdue">Overdue ({data.length})</span>
      </SectionHeading>
      <ul className="divide-y divide-line border-y border-line">
        {rows.map((t) => (
          <li key={t.id} className="flex min-h-12 items-center gap-3 py-1">
            <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={false}
                onChange={() => run(() => api(`/tasks/${t.id}`, { method: 'PATCH', body: { status: 'DONE' } }))}
                className="size-5 shrink-0 cursor-pointer accent-[var(--accent)]"
              />
              <span className="min-w-0">
                <span className="block truncate">{t.title}</span>
                <span className="block text-xs text-muted">from {formatDay(t.dueDate)}</span>
              </span>
            </label>
            <Button variant="ghost" onClick={() => run(() => api(`/tasks/${t.id}`, { method: 'PATCH', body: { dueDate: today } }))} aria-label={`Move ${t.title} to today`}>
              Move to today
            </Button>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <Button variant="ghost" className="mt-2" onClick={() => setAll(true)}>
          Show {hidden} more
        </Button>
      )}
      <ErrorText>{error}</ErrorText>
    </section>
  );
}
