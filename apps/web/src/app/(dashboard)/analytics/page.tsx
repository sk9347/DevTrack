'use client';

import { useState } from 'react';
import { DayBars } from '@/components/charts/day-bars';
import { Button, PageHeader, Panel, Region, SectionHeading } from '@/components/ui/controls';
import { StatRow } from '@/features/dashboard/stat-row';
import { formatMinutes, percent } from '@/lib/format';
import { useFetch } from '@/lib/use-fetch';
import type { Overview } from '@/types';

const PERIODS = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'Last 30 days' },
] as const;

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const state = useFetch<Overview>(`/analytics/overview?period=${period}`);
  const { data } = state;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="The shape of your practice, without the noise."
        actions={
          <div role="group" aria-label="Period" className="flex rounded-lg border border-line bg-surface-secondary p-1">
            {PERIODS.map((p) => (
              <Button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                aria-pressed={period === p.id}
                variant={period === p.id ? 'primary' : 'ghost'}
                className="px-3"
              >
                {p.label}
              </Button>
            ))}
          </div>
        }
      />

      <Panel>
        <Region state={state} what="the summary" skeleton="h-24">
          {(o) => <StatRow o={o} />}
        </Region>
      </Panel>

      <section className="mt-6" aria-labelledby="daily">
        <Panel>
          <SectionHeading>
            <span id="daily">Minutes per day</span>
          </SectionHeading>
          <Region state={state} what="the chart" skeleton="h-56">
            {(o) => <DayBars daily={o.daily} today={o.today} />}
          </Region>
        </Panel>
      </section>

      <section className="mt-6" aria-labelledby="by-habit">
        <Panel>
          <SectionHeading>
            <span id="by-habit">By habit</span>
          </SectionHeading>
          {!data ? (
            <Region state={state} what="the habit breakdown" skeleton="h-24">
              {() => null}
            </Region>
          ) : data.habits.length === 0 ? (
            <p className="text-sm text-muted">Add a habit to see how consistently you hit your targets.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2 font-medium">Habit</th>
                    <th className="py-2 text-right font-medium">Time</th>
                    <th className="py-2 text-right font-medium">Days met</th>
                    <th className="py-2 text-right font-medium">On pace</th>
                  </tr>
                </thead>
                <tbody>
                  {data.habits.map((h) => (
                    <tr key={h.habitId} className="border-b border-line last:border-0">
                      <td className="py-3">
                        <span className="mr-2 inline-block size-2.5 rounded-full align-middle" style={{ backgroundColor: h.color }} aria-hidden />
                        {h.name}
                      </td>
                      <td className="num py-3 text-right">{formatMinutes(h.minutes)}</td>
                      <td className="num py-3 text-right">
                        {h.daysMet}/{h.paceDays}
                        {h.paceDays < h.targetDays && <span className="ml-1.5 font-sans text-muted">of {h.targetDays}</span>}
                      </td>
                      <td className="num py-3 text-right">{percent(h.completion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>
    </>
  );
}
