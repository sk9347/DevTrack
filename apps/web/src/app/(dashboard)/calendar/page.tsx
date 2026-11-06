'use client';

import { useState } from 'react';
import { Heatmap } from '@/components/charts/heatmap';
import { PageHeader, Panel, Region } from '@/components/ui/controls';
import { DayDetail } from '@/features/calendar/day-detail';
import { useFetch } from '@/lib/use-fetch';
import type { DayTrack, Heatmap as HeatmapData } from '@/types';

export default function CalendarPage() {
  const heatmap = useFetch<HeatmapData>('/analytics/heatmap?weeks=53');
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked ?? heatmap.data?.to ?? null;
  const track = useFetch<DayTrack>(selected ? `/analytics/day?date=${selected}` : null);

  return (
    <>
      <PageHeader
        title="Calendar"
        description={
          <>
            Every cell is a day. Select one to see what you studied.{' '}
            {heatmap.data && <span className="tabular-nums">Longest streak: {heatmap.data.streak.longest} days.</span>}
          </>
        }
      />

      <Panel>
        <Region state={heatmap} what="your calendar" skeleton="h-32">
          {(h) => <Heatmap fit days={h.days} selected={selected ?? undefined} onSelect={setPicked} />}
        </Region>
      </Panel>

      <div className="mt-6">
        <Panel>
          <Region state={track} what="this day" skeleton="h-40">
            {(t) => <DayDetail track={t} />}
          </Region>
        </Panel>
      </div>
    </>
  );
}
