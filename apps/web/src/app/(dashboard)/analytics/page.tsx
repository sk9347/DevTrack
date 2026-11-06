'use client';

import { useState } from 'react';
import { DayBars } from '@/components/charts/day-bars';
import { Region, SectionHeading } from '@/components/ui/controls';
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div role="group" aria-label="Period" className="flex rounded-md border border-line-strong p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              aria-pressed={period === p.id}
              className={`min-h-10 cursor-pointer rounded px-4 text-sm transition-colors duration-150 ${period === p.id ? 'bg-raised font-medium text-fg' : 'text-muted hover:text-fg'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Region state={state} what="the summary" skeleton="h-24">
          {(o) => <StatRow o={o} />}
        </Region>
      </div>

      <section className="mt-10" aria-labelledby="daily">
        <SectionHeading>
          <span id="daily">Minutes per day</span>
        </SectionHeading>
        <Region state={state} what="the chart" skeleton="h-56">
          {(o) => <DayBars daily={o.daily} today={o.today} />}
        </Region>
      </section>

      <section className="mt-10" aria-labelledby="by-habit">
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
                <tr key={h.habitId} className="border-b border-line">
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
        )}
      </section>
    </>
  );
}
