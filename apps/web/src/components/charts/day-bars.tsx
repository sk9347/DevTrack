'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDay, formatMinutes } from '@/lib/format';
import type { Overview } from '@/types';

export function DayBars({ daily, today }: { daily: Overview['daily']; today: string }) {
  const data = daily.map((d) => ({ ...d, label: d.date.slice(8) }));
  const summary = daily.map((d) => `${formatDay(d.date)} ${formatMinutes(d.minutes)}`).join(', ');
  return (
    <div role="img" aria-label={`Minutes studied per day. ${summary}`} className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={(v) => `${v}m`} />
          <Tooltip
            cursor={{ fill: 'var(--raised)' }}
            contentStyle={{ background: 'var(--raised)', border: '1px solid var(--line-strong)', borderRadius: 6, color: 'var(--fg)' }}
            labelFormatter={(_, p) => (p?.[0] ? formatDay(p[0].payload.date) : '')}
            formatter={(v) => [formatMinutes(Number(v)), 'Studied']}
          />
          <Bar
            dataKey="minutes"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
            shape={(p: any) => (
              <rect x={p.x} y={p.y} width={p.width} height={p.height} rx={3} fill={p.payload.date === today ? 'var(--accent)' : 'var(--heat-2)'} />
            )}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
