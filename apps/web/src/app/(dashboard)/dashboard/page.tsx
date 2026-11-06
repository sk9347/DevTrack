'use client';

import { useEffect, useState } from 'react';
import { DayBars } from '@/components/charts/day-bars';
import { Heatmap } from '@/components/charts/heatmap';
import { Button, Region, SectionHeading } from '@/components/ui/controls';
import { FirstRun } from '@/features/dashboard/first-run';
import { HabitProgress } from '@/features/dashboard/habit-progress';
import { StatRow } from '@/features/dashboard/stat-row';
import { LogSessionDialog } from '@/features/sessions/log-session-dialog';
import { TasksPanel } from '@/features/tasks/tasks-panel';
import { formatMinutes } from '@/lib/format';
import { useFetch } from '@/lib/use-fetch';
import type { DayTrack, Heatmap as HeatmapData, Overview } from '@/types';

export default function DashboardPage() {
  const day = useFetch<DayTrack>('/analytics/day');
  const overview = useFetch<Overview>('/analytics/overview?period=week');
  const heatmap = useFetch<HeatmapData>('/analytics/heatmap?weeks=26');
  const [logging, setLogging] = useState<{ habitId?: string } | null>(null);
  const [logged, setLogged] = useState<{ habitId: string; minutes: number; before: number } | null>(null);

  // The confirmation is a passing note, not state to keep: it fades after a few seconds.
  useEffect(() => {
    if (!logged) return;
    const t = setTimeout(() => setLogged(null), 6000);
    return () => clearTimeout(t);
  }, [logged]);

  const habits = day.data?.habits;
  const firstRun = habits !== undefined && habits.length === 0;
  const confirmed = logged && habits?.find((h) => h.id === logged.habitId);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Today</h1>
        {!firstRun && (
          <Button variant="primary" onClick={() => setLogging({})} disabled={!day.data}>
            Log study time
          </Button>
        )}
      </div>

      <p role="status" className="mt-3 min-h-5 text-sm text-muted">
        {confirmed &&
          logged &&
          (confirmed.minutes >= logged.before + logged.minutes
            ? `Logged ${formatMinutes(logged.minutes)} for ${confirmed.name}. Today ${formatMinutes(confirmed.minutes)} / ${formatMinutes(confirmed.dailyTargetMinutes)}${confirmed.met ? ', Met.' : '.'}`
            : `Logged ${formatMinutes(logged.minutes)} for ${confirmed.name}.`)}
      </p>

      {firstRun ? (
        <FirstRun />
      ) : (
        <>
          <div className="mt-4 grid gap-10 lg:grid-cols-2">
            <section aria-labelledby="today-habits">
              <SectionHeading>
                <span id="today-habits">Habits today</span>
              </SectionHeading>
              <Region state={day} what="today's habits" skeleton="h-32">
                {(d) => <HabitProgress habits={d.habits} onLog={(habitId) => setLogging({ habitId })} />}
              </Region>
            </section>

            <section aria-labelledby="today-tasks">
              <SectionHeading>
                <span id="today-tasks">Tasks due today</span>
              </SectionHeading>
              <Region state={day} what="today's tasks" skeleton="h-32">
                {(d) => <TasksPanel date={d.date} />}
              </Region>
            </section>
          </div>

          <section className="mt-10" aria-labelledby="week-summary">
            <SectionHeading>
              <span id="week-summary">Week summary</span>
            </SectionHeading>
            <Region state={overview} what="this week's summary" skeleton="h-24">
              {(o) => <StatRow o={o} />}
            </Region>
          </section>

          <section className="mt-10" aria-labelledby="week-chart">
            <SectionHeading>
              <span id="week-chart">Minutes per day</span>
            </SectionHeading>
            <Region state={overview} what="the weekly chart" skeleton="h-56">
              {(o) => <DayBars daily={o.daily} today={o.today} />}
            </Region>
          </section>

          <section className="mt-12" aria-labelledby="consistency">
            <SectionHeading>
              <span id="consistency">Consistency, last 26 weeks</span>
            </SectionHeading>
            <Region state={heatmap} what="your consistency history" skeleton="h-28">
              {(h) => <Heatmap days={h.days} summary={h.streak} />}
            </Region>
          </section>
        </>
      )}

      <LogSessionDialog
        open={logging !== null}
        onClose={() => setLogging(null)}
        habits={habits ?? []}
        tasks={day.data?.tasks.filter((t) => t.status === 'TODO') ?? []}
        defaultHabitId={logging?.habitId}
        onSaved={({ habitId, minutes }) => setLogged({ habitId, minutes, before: habits?.find((h) => h.id === habitId)?.minutes ?? 0 })}
      />
    </>
  );
}
