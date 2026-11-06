'use client';

import { useEffect, useRef } from 'react';
import { formatDay, formatMinutes } from '@/lib/format';
import type { Heatmap as HeatmapData } from '@/types';

interface Props {
  days: HeatmapData['days'];
  selected?: string;
  onSelect?: (date: string) => void;
  /** Stretch cells to fill the container instead of using a fixed 16px cell. */
  fit?: boolean;
}

const LEVEL_BG = ['var(--heat-0)', 'var(--heat-1)', 'var(--heat-2)', 'var(--heat-3)', 'var(--heat-4)'];
const CELL = 16;
const GAP = 3;

export function labelFor(day: { date: string; minutes: number }) {
  return day.minutes > 0 ? `${formatDay(day.date)}: ${formatMinutes(day.minutes)} studied` : `${formatDay(day.date)}: no study logged`;
}

/** One label per month, placed on the first week column that starts in that month. */
export function monthLabels(days: { date: string }[]): { week: number; label: string }[] {
  const weeks = Math.ceil(days.length / 7);
  const out: { week: number; label: string }[] = [];
  let prev = -1;
  for (let w = 0; w < weeks; w++) {
    const month = Number(days[w * 7].date.slice(5, 7));
    if (month !== prev) {
      out.push({ week: w, label: new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(new Date(`${days[w * 7].date}T00:00:00Z`)) });
      prev = month;
    }
  }
  // Drop labels that would collide with the next one (a partial first month) or overflow the right
  // edge (a month that has only just begun), so labels never widen the scroll area.
  return out.filter((l, i) => (i === out.length - 1 || out[i + 1].week - l.week >= 3) && l.week <= weeks - 3);
}

/** Contribution calendar: columns are weeks (Mon-Sun), rows are weekdays. `days` must start on a Monday. */
export function Heatmap({ days, selected, onSelect, fit = false }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const weeks = Math.ceil(days.length / 7);

  // Today is at the right edge; make sure the newest weeks are what the user sees first.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [days.length]);

  const columns = fit ? `repeat(${weeks}, minmax(${CELL - 2}px, 1fr))` : `repeat(${weeks}, ${CELL}px)`;
  const minWidth = weeks * (CELL - 2 + GAP);

  return (
    <figure>
      <div ref={scroller} className="overflow-x-auto pb-2" role="group" aria-label="Study activity by day">
        <div style={{ minWidth, width: fit ? '100%' : 'max-content' }}>
          <div className="mb-1 grid h-4 text-xs text-muted" style={{ gridTemplateColumns: columns, columnGap: GAP }} aria-hidden>
            {monthLabels(days).map((m) => (
              <span key={m.week} className="whitespace-nowrap" style={{ gridColumn: m.week + 1 }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className="grid grid-flow-col grid-rows-7" style={{ gridTemplateColumns: columns, gap: GAP }}>
            {days.map((d) => {
              const style = { backgroundColor: LEVEL_BG[d.level] };
              const common = 'aspect-square w-full rounded-[3px]';
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
