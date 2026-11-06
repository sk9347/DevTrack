'use client';

import { useEffect, useState } from 'react';
import { Button, TextInput } from '@/components/ui/controls';
import { formatDayLong, shiftDay } from '@/lib/format';
import { api } from '@/lib/api-client';
import { TasksPanel } from '@/features/tasks/tasks-panel';

export default function TasksPage() {
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    api<{ date: string }>('/analytics/day').then((d) => setDate(d.date)).catch(() => {});
  }, []);

  if (!date) return <h1 className="text-2xl font-semibold">Tasks</h1>;

  return (
    <>
      <h1 className="text-2xl font-semibold">Tasks</h1>
      <div className="mb-6 mt-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setDate(shiftDay(date, -1))} aria-label="Previous day">
          ←
        </Button>
        <label className="sr-only" htmlFor="task-date">
          Date
        </label>
        <div className="w-48">
          <TextInput id="task-date" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={() => setDate(shiftDay(date, 1))} aria-label="Next day">
          →
        </Button>
      </div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{formatDayLong(date)}</h2>
      <TasksPanel date={date} />
    </>
  );
}
