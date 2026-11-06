'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDay, formatMinutes } from '@/lib/format';
import type { Overview } from '@/types';

export function DayBars({ daily, today }: { daily: Overview['daily']; today: string }) {
  // A week reads best as weekday names; a month as day-of-month numbers.
  const weekly = daily.length <= 7;
  const data = daily.map((d) => ({
    ...d,
    label: weekly ? formatDay(d.date).split(' ')[0] : d.date.slice(8),
  }));
  const summary = daily.map((d) => `${formatDay(d.date)} ${formatMinutes(d.minutes)}`).join(', ');
  return (
    <div role="img" aria-label={`Minutes studied per day. ${summary}`} className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={(v) => `${v}m`} />
          <Tooltip
            cursor={{ fill: 'var(--surface-secondary)' }}
            contentStyle={{
              background: 'var(--overlay)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              boxShadow: '0 12px 32px rgb(0 0 0 / 0.35)',
              color: 'var(--foreground)',
            }}
            labelStyle={{ color: 'var(--muted)' }}
            labelFormatter={(_, p) => (p?.[0] ? formatDay(p[0].payload.date) : '')}
            formatter={(v) => [formatMinutes(Number(v)), 'Studied']}
          />
          <Bar
            dataKey="minutes"
            maxBarSize={48}
            isAnimationActive={false}
            shape={(p: any) => (
              <rect x={p.x} y={p.y} width={p.width} height={p.height} rx={4} fill={p.payload.date === today ? 'var(--accent)' : 'var(--heat-3)'} />
            )}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
