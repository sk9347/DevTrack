'use client';

import { useEffect, useState } from 'react';
import { Button, PageHeader, Panel, Skeleton, TextInput } from '@/components/ui/controls';
import { formatDayLong, shiftDay } from '@/lib/format';
import { api } from '@/lib/api-client';
import { TasksPanel } from '@/features/tasks/tasks-panel';

export default function TasksPage() {
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    api<{ date: string }>('/analytics/day').then((d) => setDate(d.date)).catch(() => {});
  }, []);

  return (
    <>
      <PageHeader title="Tasks" description="Plan a day, then keep the list honest." />

      {!date ? (
        <Panel>
          <Skeleton className="h-24" />
        </Panel>
      ) : (
        <>
          <Panel className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" className="size-11 px-0" onClick={() => setDate(shiftDay(date, -1))} aria-label="Previous day">
                ←
              </Button>
              <label className="sr-only" htmlFor="task-date">
                Date
              </label>
              <div className="w-48">
                <TextInput id="task-date" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
              </div>
              <Button variant="secondary" className="size-11 px-0" onClick={() => setDate(shiftDay(date, 1))} aria-label="Next day">
                →
              </Button>
              <p className="ml-auto text-sm text-muted">{formatDayLong(date)}</p>
            </div>
          </Panel>
          <Panel>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{formatDayLong(date)}</h2>
            <TasksPanel date={date} />
          </Panel>
        </>
      )}
    </>
  );
}
