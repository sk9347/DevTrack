'use client';

import { useState } from 'react';
import { DayBars } from '@/components/charts/day-bars';
import { Heatmap } from '@/components/charts/heatmap';
import { Button, ErrorText, SectionHeading, Skeleton } from '@/components/ui/controls';
import { HabitProgress } from '@/features/dashboard/habit-progress';
import { StatRow } from '@/features/dashboard/stat-row';
import { LogSessionDialog } from '@/features/sessions/log-session-dialog';
import { TasksPanel } from '@/features/tasks/tasks-panel';
import { useFetch } from '@/lib/use-fetch';
import type { DayTrack, Heatmap as HeatmapData, Overview } from '@/types';

export default function DashboardPage() {
  const day = useFetch<DayTrack>('/analytics/day');
  const overview = useFetch<Overview>('/analytics/overview?period=week');
  const heatmap = useFetch<HeatmapData>('/analytics/heatmap?weeks=26');
  const [logging, setLogging] = useState<{ habitId?: string } | null>(null);

  const error = day.error ?? overview.error ?? heatmap.error;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Today</h1>
        <Button variant="primary" onClick={() => setLogging({})} disabled={!day.data}>
          Log study time
        </Button>
      </div>

      <ErrorText>{error}</ErrorText>

      <div className="mt-6">{overview.data ? <StatRow o={overview.data} /> : <Skeleton className="h-24" />}</div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="today-habits">
          <SectionHeading>
            <span id="today-habits">Habits today</span>
          </SectionHeading>
          {day.data ? <HabitProgress habits={day.data.habits} onLog={(habitId) => setLogging({ habitId })} /> : <Skeleton className="h-32" />}
        </section>

        <section aria-labelledby="today-tasks">
          <SectionHeading>
            <span id="today-tasks">Tasks due today</span>
          </SectionHeading>
          {day.data ? <TasksPanel date={day.data.date} /> : <Skeleton className="h-32" />}
        </section>
      </div>

      <section className="mt-12" aria-labelledby="week-chart">
        <SectionHeading>
          <span id="week-chart">This week</span>
        </SectionHeading>
        {overview.data ? <DayBars daily={overview.data.daily} today={overview.data.today} /> : <Skeleton className="h-56" />}
      </section>

      <section className="mt-12" aria-labelledby="consistency">
        <SectionHeading>
          <span id="consistency">Consistency, last 26 weeks</span>
        </SectionHeading>
        {heatmap.data ? <Heatmap days={heatmap.data.days} /> : <Skeleton className="h-28" />}
      </section>

      <LogSessionDialog
        open={logging !== null}
        onClose={() => setLogging(null)}
        habits={day.data?.habits ?? []}
        tasks={day.data?.tasks.filter((t) => t.status === 'TODO') ?? []}
        defaultHabitId={logging?.habitId}
      />
    </>
  );
}
