import { formatMinutes, percent } from '@/lib/format';
import type { Overview } from '@/types';

/** Flat definition list, not a card mosaic: four numbers, read left to right. */
export function StatRow({ o }: { o: Overview }) {
  const stats = [
    { label: 'This week', value: formatMinutes(o.totalMinutes) },
    { label: 'Current streak', value: `${o.streak.current} ${o.streak.current === 1 ? 'day' : 'days'}` },
    { label: 'Tasks done', value: `${o.tasks.done}/${o.tasks.total}` },
    { label: 'Habit completion', value: percent(o.habitCompletion) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-5 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label}>
          <dt className="text-sm text-muted">{s.label}</dt>
          <dd className="num mt-1 text-2xl font-medium">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
