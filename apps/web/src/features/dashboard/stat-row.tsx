import { formatMinutes, percent } from '@/lib/format';
import type { Overview } from '@/types';

/** Flat definition list, not a card mosaic: four numbers, read left to right. */
export function StatRow({ o }: { o: Overview }) {
  const stats: { label: string; value: string; note?: string }[] = [
    { label: 'This week', value: formatMinutes(o.totalMinutes) },
    {
      label: 'Current streak',
      value: `${o.streak.current} ${o.streak.current === 1 ? 'day' : 'days'}`,
      // A missed day resets the run, never the record: keep the best visible so "0 days" doesn't read as lost history.
      note: o.streak.longest > o.streak.current ? `Best ${o.streak.longest} ${o.streak.longest === 1 ? 'day' : 'days'}` : undefined,
    },
    { label: 'Tasks done', value: `${o.tasks.done}/${o.tasks.total}` },
    { label: 'Habit completion', value: percent(o.habitCompletion) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="min-w-0">
          <dt className="text-sm text-muted">{s.label}</dt>
          <dd className="mt-1 text-2xl font-medium tabular-nums tracking-tight">
            {s.value}
            {s.note && <span className="block text-sm font-normal text-muted">{s.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
