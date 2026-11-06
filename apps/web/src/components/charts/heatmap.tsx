import { formatDay, formatMinutes } from '@/lib/format';
import type { Heatmap as HeatmapData } from '@/types';

interface Props {
  days: HeatmapData['days'];
  selected?: string;
  onSelect?: (date: string) => void;
}

const LEVEL_BG = ['var(--heat-0)', 'var(--heat-1)', 'var(--heat-2)', 'var(--heat-3)', 'var(--heat-4)'];

export function labelFor(day: { date: string; minutes: number }) {
  return day.minutes > 0 ? `${formatDay(day.date)}: ${formatMinutes(day.minutes)} studied` : `${formatDay(day.date)}: no study logged`;
}

/** Contribution calendar: columns are weeks (Mon-Sun), rows are weekdays. `days` must start on a Monday. */
export function Heatmap({ days, selected, onSelect }: Props) {
  return (
    <figure>
      <div className="overflow-x-auto pb-2" role="group" aria-label="Study activity by day">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-[3px]">
          {days.map((d) => {
            const style = { backgroundColor: LEVEL_BG[d.level] };
            const common = 'size-3.5 rounded-[3px] sm:size-4';
            return onSelect ? (
              <button
                key={d.date}
                type="button"
                title={labelFor(d)}
                aria-label={labelFor(d)}
                aria-pressed={selected === d.date}
                onClick={() => onSelect(d.date)}
                style={style}
                className={`${common} cursor-pointer outline-offset-1 hover:ring-1 hover:ring-muted ${selected === d.date ? 'ring-2 ring-fg' : ''}`}
              />
            ) : (
              <div key={d.date} role="img" title={labelFor(d)} aria-label={labelFor(d)} style={style} className={common} />
            );
          })}
        </div>
      </div>
      <figcaption className="mt-2 flex items-center justify-end gap-1.5 text-xs text-muted">
        Less
        {LEVEL_BG.map((bg, i) => (
          <span key={i} className="size-3 rounded-[3px]" style={{ backgroundColor: bg }} aria-hidden />
        ))}
        More
      </figcaption>
    </figure>
  );
}
